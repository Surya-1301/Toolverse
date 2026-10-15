"use strict";

const express = require("express");
const { spawn } = require("child_process");
const fs = require("fs");
const fsp = fs.promises;
const path = require("path");
const crypto = require("crypto");
const os = require("os");

const app = express();
app.disable("x-powered-by");
app.use(express.json({ limit: "100kb" }));
app.set("trust proxy", 1);

const PORT = Number(process.env.PORT || 3000);
const TMPDIR = process.env.TMPDIR || os.tmpdir();
const MAX_MS = Number(process.env.MAX_MINUTES || 10) * 60 * 1000;
const CACHE_MS = Number(process.env.CACHE_MIN || 10) * 60 * 1000;
const COOKIES_PATH = path.join(__dirname, "cookies.txt");

if (process.env.COOKIES_B64 && !fs.existsSync(COOKIES_PATH)) {
  try {
    fs.writeFileSync(
      COOKIES_PATH,
      Buffer.from(process.env.COOKIES_B64, "base64"),
      { mode: 0o600 },
    );
  } catch (e) {
    console.error("Could not write COOKIES_B64:", String(e).slice(0, 120));
  }
}
const HAS_COOKIES = fs.existsSync(COOKIES_PATH);

const API_KEY = process.env.API_KEY || "";
const CORS_ORIGIN = process.env.CORS_ORIGIN || "*";

// ---- CORS (the Toolverse site calls this from the browser) ----
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", CORS_ORIGIN);
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, X-Api-Key");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});

// ---- API key gate (only when API_KEY is set) ----
if (API_KEY) {
  app.use((req, res, next) => {
    // Plain anchor downloads can't send headers, so accept ?api_key= too.
    const provided = req.headers["x-api-key"] || req.query.api_key;
    if (provided !== API_KEY) {
      return res.status(401).json({ error: "Unauthorized." });
    }
    next();
  });
}

// ---- tiny rate limiter (per IP, in-memory) ----
const hits = new Map(); // ip -> { n, reset }
function rateLimit(maxPerMin) {
  return (req, res, next) => {
    const ip =
      req.ip || req.connection?.remoteAddress || "unknown";
    const now = Date.now();
    let h = hits.get(ip);
    if (!h || now > h.reset) h = { n: 0, reset: now + 60000 };
    h.n += 1;
    hits.set(ip, h);
    if (h.n > maxPerMin) {
      return res
        .status(429)
        .json({ error: "Too many requests — slow down a little." });
    }
    next();
  };
}

// ---- parse cache (YouTube rate-limits hard; don't re-parse needlessly) ----
const parseCache = new Map(); // url -> { data, expires }
setInterval(() => {
  const now = Date.now();
  for (const [k, v] of parseCache) if (v.expires < now) parseCache.delete(k);
}, 60000).unref();

// ---- helpers ----
function runYtDlp(args, timeoutMs) {
  return new Promise((resolve, reject) => {
    const fullArgs = [
      ...(HAS_COOKIES ? ["--cookies", COOKIES_PATH] : []),
      ...args,
    ];
    const proc = spawn("yt-dlp", fullArgs, { timeout: timeoutMs });
    let stdout = "";
    let stderr = "";
    proc.stdout.on("data", (d) => {
      stdout += d;
    });
    proc.stderr.on("data", (d) => {
      stderr += d;
    });
    proc.on("error", reject);
    proc.on("close", (code) => {
      if (code === 0) {
        resolve({ stdout, stderr });
      } else {
        const tail = stderr.trim().split("\n").slice(-3).join(" ").slice(0, 300);
        reject(new Error(tail || `yt-dlp exited with code ${code}`));
      }
    });
  });
}

function isValidUrl(u) {
  try {
    const p = new URL(String(u));
    return p.protocol === "http:" || p.protocol === "https:";
  } catch {
    return false;
  }
}

function sanitizeFilename(name) {
  const clean = String(name || "video")
    .replace(/[^\w\-. ]+/g, "_")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 80);
  return clean || "video";
}

function fmtBytes(n) {
  if (!n || n <= 0) return null;
  const u = ["B", "KB", "MB", "GB"];
  let i = 0;
  let v = n;
  while (v >= 1024 && i < u.length - 1) {
    v /= 1024;
    i++;
  }
  return `${v.toFixed(v >= 100 ? 0 : 1)} ${u[i]}`;
}

// Build a vidssave-style resources table from yt-dlp's format list.
function buildResources(info) {
  const formats = info.formats || [];
  const byHeight = new Map(); // height -> best format
  let bestAudio = null;

  for (const f of formats) {
    const hasVideo = f.vcodec && f.vcodec !== "none";
    const hasAudio = f.acodec && f.acodec !== "none";
    const size = f.filesize || f.filesize_approx || 0;

    if (hasVideo && f.height) {
      const cur = byHeight.get(f.height);
      // Prefer the variant that already has audio, then the bigger file.
      const score = (hasAudio ? 1e15 : 0) + size;
      const curScore = cur
        ? (cur.hasAudio ? 1e15 : 0) + (cur.size || 0)
        : -1;
      if (score > curScore) {
        byHeight.set(f.height, {
          id: f.format_id,
          quality: f.height,
          ext: "mp4",
          size,
          sizeLabel: fmtBytes(size),
          hasAudio,
          fps: f.fps || null,
        });
      }
    } else if (!hasVideo && hasAudio) {
      const abr = f.abr || 0;
      if (!bestAudio || abr > (bestAudio.abr || 0)) {
        bestAudio = { id: f.format_id, abr, size };
      }
    }
  }

  const resources = [...byHeight.values()].sort((a, b) => a.quality - b.quality);
  // Keep the standard ladder + anything higher the video actually has.
  const standards = [144, 240, 360, 480, 720, 1080, 1440, 2160];
  const ladder = resources.filter((r) =>
    standards.some((s) => Math.abs(r.quality - s) <= s * 0.1),
  );
  const extra = resources.filter((r) => !ladder.includes(r) && r.quality > 1080);
  const video = [...ladder, ...extra].sort((a, b) => a.quality - b.quality);

  if (bestAudio) {
    video.push({
      id: bestAudio.id,
      quality: 0,
      ext: "mp3",
      size: bestAudio.size || 0,
      sizeLabel: fmtBytes(bestAudio.size),
      hasAudio: true,
      fps: null,
      audioOnly: true,
    });
  }
  return video;
}

// ---- routes ----
app.get("/", (req, res) => {
  res.json({
    ok: true,
    service: "toolverse-yt-backend",
    cookies: HAS_COOKIES,
    maxMinutes: Number(process.env.MAX_MINUTES || 10),
  });
});

// Video metadata + full resource table.
app.post("/api/info", rateLimit(30), async (req, res) => {
  const { url } = req.body || {};
  if (!isValidUrl(url)) {
    return res.status(400).json({ error: "A valid video URL is required." });
  }
  const key = String(url).trim();

  const cached = parseCache.get(key);
  if (cached && cached.expires > Date.now()) {
    return res.json({ ...cached.data, cached: true });
  }

  try {
    const { stdout } = await runYtDlp(
      ["--dump-json", "--no-playlist", "--no-warnings", key],
      90000,
    );
    const info = JSON.parse(stdout);
    const resources = buildResources(info);

    const data = {
      title: info.title || "video",
      thumbnail: info.thumbnail || null,
      duration: info.duration || null,
      uploader: info.uploader || info.channel || null,
      isLive: !!info.is_live,
      resources,
      qualities: resources.filter((r) => !r.audioOnly).map((r) => r.quality),
      hasAudio: resources.some((r) => r.audioOnly || r.hasAudio),
      cookies: HAS_COOKIES,
    };
    parseCache.set(key, { data, expires: Date.now() + CACHE_MS });
    res.json(data);
  } catch (e) {
    res.status(502).json({
      error: "Could not fetch video info.",
      detail: String((e && e.message) || e).slice(0, 200),
      hint: HAS_COOKIES
        ? undefined
        : "Try adding cookies.txt (see README) — YouTube blocks anonymous server IPs.",
    });
  }
});

// Download a specific resource (or auto-pick by quality / audio flag).
app.get("/api/download", rateLimit(20), async (req, res) => {
  const { url, format_id, quality, audio } = req.query;
  if (!isValidUrl(url)) {
    return res.status(400).json({ error: "A valid video URL is required." });
  }
  const audioOnly = audio === "1";
  const id = crypto.randomBytes(8).toString("hex");
  const outTmpl = path.join(TMPDIR, `tvdl-${id}.%(ext)s`);

  let args;
  if (audioOnly) {
    args = ["-x", "--audio-format", "mp3", "--audio-quality", "0"];
  } else if (format_id && /^[A-Za-z0-9_-]+$/.test(String(format_id))) {
    // Exact resource from /api/info; merge with best audio when needed.
    args = [
      "-f",
      `${format_id}+bestaudio/best`,
      "--merge-output-format",
      "mp4",
    ];
  } else {
    const q = Math.max(144, Math.min(2160, parseInt(quality, 10) || 720));
    args = [
      "-f",
      `bv*[height<=${q}]+ba/b[height<=${q}]/b/best`,
      "--merge-output-format",
      "mp4",
    ];
  }

  const cleanupFiles = async () => {
    try {
      const files = await fsp.readdir(TMPDIR);
      await Promise.all(
        files
          .filter((f) => f.startsWith(`tvdl-${id}.`))
          .map((f) => fsp.unlink(path.join(TMPDIR, f)).catch(() => {})),
      );
    } catch {
      /* ignore */
    }
  };

  try {
    await runYtDlp(
      [
        ...args,
        "--no-playlist",
        "--no-warnings",
        "--retries",
        "3",
        "--concurrent-fragments",
        "4",
        "-o",
        outTmpl,
        String(url),
      ],
      MAX_MS,
    );

    const files = (await fsp.readdir(TMPDIR)).filter((f) =>
      f.startsWith(`tvdl-${id}.`),
    );
    if (!files.length) throw new Error("download produced no file");
    const filePath = path.join(TMPDIR, files[0]);

    let title = "download";
    try {
      const r = await runYtDlp(
        ["--print", "%(title)s", "--no-playlist", "--no-warnings", String(url)],
        60000,
      );
      const t = r.stdout.trim().split("\n")[0];
      if (t) title = t;
    } catch {
      /* non-fatal */
    }

    const ext = audioOnly ? "mp3" : "mp4";
    const filename = `${sanitizeFilename(title)}.${ext}`;
    const cleanup = () => fsp.unlink(filePath).catch(() => {});
    res.on("finish", cleanup);
    res.on("close", cleanup);
    res.download(filePath, filename);
  } catch (e) {
    await cleanupFiles();
    if (!res.headersSent) {
      res.status(502).json({
        error: "Download failed.",
        detail: String((e && e.message) || e).slice(0, 200),
      });
    }
  }
});

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(
    `toolverse-yt-backend on :${PORT} (cookies: ${HAS_COOKIES ? "yes" : "no"})`,
  );
});
