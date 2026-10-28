"use strict";

const express = require("express");
const { spawn } = require("child_process");
const fs = require("fs");
const fsp = fs.promises;
const path = require("path");
const crypto = require("crypto");
const os = require("os");
const dns = require("dns");
const https = require("https");
if (dns.setDefaultResultOrder) {
  dns.setDefaultResultOrder("ipv4first");
}

function httpsGet(urlStr, headers = {}) {
  return new Promise((resolve, reject) => {
    const req = https.get(
      urlStr,
      {
        family: 4,
        headers: {
          "User-Agent": "com.google.android.youtube/20.10.38 (Linux; U; ANDROID 11) gzip",
          "Accept": "application/json",
          ...headers,
        },
        timeout: 6000,
      },
      (res) => {
        let text = "";
        res.on("data", (chunk) => (text += chunk));
        res.on("end", () => resolve({ status: res.statusCode, text }));
      },
    );
    req.on("error", reject);
    req.on("timeout", () => req.destroy(new Error("httpsGet timeout (family 4)")));
  });
}

function innertubePost(payload, headers = {}) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(payload);
    const req = https.request(
      "https://www.youtube.com/youtubei/v1/player?key=AIzaSyAO_FJ2SlqU8Q4STEHLGCilw_Y9_11qcW8&hl=en",
      {
        method: "POST",
        family: 4,
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(data),
          "User-Agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
          ...headers,
        },
        timeout: 8000,
      },
      (res) => {
        let text = "";
        res.on("data", (chunk) => (text += chunk));
        res.on("end", () => {
          try {
            resolve({ status: res.statusCode, data: JSON.parse(text) });
          } catch (err) {
            resolve({ status: res.statusCode, text, error: err.message });
          }
        });
      },
    );
    req.on("error", reject);
    req.on("timeout", () => req.destroy(new Error("Innertube POST timeout (family 4)")));
    req.write(data);
    req.end();
  });
}

const app = express();
app.disable("x-powered-by");
app.use(express.json({ limit: "100kb" }));
app.set("trust proxy", 1);

const PORT = Number(process.env.PORT || 3000);
const TMPDIR = process.env.TMPDIR || os.tmpdir();
const MAX_MS = Number(process.env.MAX_MINUTES || 10) * 60 * 1000;
const CACHE_MS = Number(process.env.CACHE_MIN || 10) * 60 * 1000;
function netscapeToCookieHeader(text) {
  if (!text || typeof text !== "string") return null;
  const lines = text.split("\n");
  const pairs = [];
  for (const line of lines) {
    const l = line.trim();
    if (!l || l.startsWith("#")) continue;
    const parts = l.split("\t");
    if (parts.length >= 7) {
      const name = parts[5].trim();
      const val = parts[6].trim();
      if (name) pairs.push(`${name}=${val}`);
    } else if (l.includes("=")) {
      pairs.push(l);
    }
  }
  return pairs.length ? pairs.join("; ") : null;
}

function getSapisidHash(cookieHeader, origin = "https://www.youtube.com") {
  if (!cookieHeader || typeof cookieHeader !== "string") return null;
  const match = cookieHeader.match(/(?:^|;\s*)(?:__Secure-3PAPISID|SAPISID)=([^;]+)/);
  if (!match) return null;
  const sapisid = match[1].trim();
  const ts = Math.floor(Date.now() / 1000);
  const hash = crypto.createHash("sha1").update(`${ts} ${sapisid} ${origin}`).digest("hex");
  return `SAPISIDHASH ${ts}_${hash}`;
}

const COOKIES_PATH = path.join(__dirname, "cookies.txt");

// Cookies can also arrive via env var (base64) — the safe way on Render,
// so the file never has to live in a public git repo.
if (process.env.COOKIES_B64) {
  try {
    const cleanB64 = process.env.COOKIES_B64.trim().replace(/^["']|["']$/g, "");
    const decoded = Buffer.from(cleanB64, "base64");
    fs.writeFileSync(COOKIES_PATH, decoded, { mode: 0o600 });
    console.log(`[cookies] wrote ${decoded.length} bytes to ${COOKIES_PATH}`);
  } catch (e) {
    console.error("[cookies] could not write COOKIES_B64:", String(e).slice(0, 120));
  }
}
const HAS_COOKIES = fs.existsSync(COOKIES_PATH);
let SERVER_COOKIE_HEADER = null;
if (HAS_COOKIES) {
  try {
    const raw = fs.readFileSync(COOKIES_PATH, "utf8");
    SERVER_COOKIE_HEADER = netscapeToCookieHeader(raw);
    console.log(`[cookies] server cookieHeader initialized (${SERVER_COOKIE_HEADER ? SERVER_COOKIE_HEADER.length : 0} chars)`);
  } catch (e) {
    console.error("[cookies] failed to parse server cookies:", e.message);
  }
}

const API_KEY = process.env.API_KEY || "";
const allowedOrigins = (process.env.CORS_ORIGIN || "*")
  .split(",")
  .map((s) => s.trim().replace(/\/+$/, ""))
  .filter(Boolean);

let ytDlpVersion = "unknown";
try {
  const { execSync } = require("child_process");
  try {
    execSync("yt-dlp -U", { encoding: "utf8", timeout: 30000 });
  } catch (updErr) {
    console.log("[startup] yt-dlp -U notice:", updErr.message);
  }
  ytDlpVersion = execSync("yt-dlp --version", { encoding: "utf8" }).trim();
  console.log("[startup] yt-dlp version:", ytDlpVersion);
} catch (vErr) {
  ytDlpVersion = String(vErr.message);
}

// ---- CORS (the Toolverse site calls this from the browser) ----
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (!origin || allowedOrigins.includes("*")) {
    res.setHeader("Access-Control-Allow-Origin", "*");
  } else {
    const cleanOrigin = origin.replace(/\/+$/, "");
    if (allowedOrigins.some((o) => o === cleanOrigin || o === origin)) {
      res.setHeader("Access-Control-Allow-Origin", origin);
    } else {
      res.setHeader("Access-Control-Allow-Origin", allowedOrigins[0] || "*");
    }
  }
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
function runYtDlp(args, timeoutMs, customCookiesPath) {
  return new Promise((resolve, reject) => {
    const cookiesToUse = customCookiesPath || (HAS_COOKIES ? COOKIES_PATH : null);
    const fullArgs = [
      "--force-ipv4",
      "--js-runtimes",
      "node",
      ...(cookiesToUse ? ["--cookies", cookiesToUse] : []),
      ...(process.env.PROXY_URL ? ["--proxy", process.env.PROXY_URL] : []),
      "--geo-bypass",
      "--no-check-certificates",
      "--socket-timeout",
      "12",
      ...args,
    ];
    const proc = spawn("yt-dlp", fullArgs, {
      timeout: timeoutMs,
      env: {
        ...process.env,
        PATH: `/usr/local/bin:/usr/bin:/bin:${process.env.PATH || ""}`,
      },
    });
    let stdout = "";
    let stderr = "";
    proc.stdout.on("data", (d) => {
      stdout += d;
    });
    proc.stderr.on("data", (d) => {
      stderr += d;
    });
    proc.on("error", reject);
    proc.on("close", (code, signal) => {
      if (code === 0) {
        resolve({ stdout, stderr });
      } else {
        const tail = stderr.trim().split("\n").slice(-3).join(" ").slice(0, 300);
        if (signal === "SIGTERM" || code === null) {
          reject(
            new Error(
              tail ||
                `yt-dlp extraction timed out (${Math.round(timeoutMs / 1000)}s)`,
            ),
          );
        } else {
          reject(new Error(tail || `yt-dlp exited with code ${code}`));
        }
      }
    });
  });
}

function normalizeUrl(rawUrl) {
  try {
    const u = new URL(String(rawUrl).trim());
    if (u.hostname.includes("youtube.com") || u.hostname.includes("youtu.be")) {
      const vid =
        u.searchParams.get("v") ||
        (u.hostname.includes("youtu.be")
          ? u.pathname.replace(/^\/+/, "").split("/")[0]
          : null);
      if (vid) {
        return `https://www.youtube.com/watch?v=${vid}`;
      }
    }
    if (u.hostname.includes("instagram.com") || u.hostname.includes("instagr.am")) {
      const m = u.pathname.match(/(?:reel|reels|p|share\/reel|share\/p)\/([A-Za-z0-9_-]+)/i);
      if (m) {
        return `https://www.instagram.com/reel/${m[1]}/`;
      }
    }
  } catch {}
  return String(rawUrl || "").trim();
}

async function runYtDlpWithFallback(args, timeoutMs, customCookiesPath, urlHint = "") {
  const isYt = /youtube\.com|youtu\.be/i.test(urlHint || args.join(" "));

  if (isYt) {
    if (customCookiesPath || HAS_COOKIES) {
      const attempts = [
        ["--extractor-args", "youtube:player-client=mweb,tv,web_safari"],
        ["--extractor-args", "youtube:player-client=web,web_safari"],
        ["--extractor-args", "youtube:player-client=android,web"],
        [],
      ];
      let lastErr = null;
      for (const extra of attempts) {
        try {
          return await runYtDlp([...extra, ...args], Math.min(timeoutMs || 15000, 15000), customCookiesPath);
        } catch (e) {
          lastErr = e;
        }
      }
      throw lastErr;
    } else {
      const attempts = [
        ["--extractor-args", "youtube:player-client=android,ios,web"],
        ["--extractor-args", "youtube:player-client=mweb,web_safari"],
        [],
      ];
      let lastErr = null;
      for (const extra of attempts) {
        try {
          return await runYtDlp([...extra, ...args], 12000, customCookiesPath);
        } catch (e) {
          lastErr = e;
        }
      }
      throw lastErr;
    }
  }

  // Non-YouTube (e.g. Instagram)
  return await runYtDlp(args, Math.min(timeoutMs, 40000), customCookiesPath);
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
  // Show every distinct quality the source actually has (YouTube's standard
  // ladder as well as odd heights like Instagram's 960p).
  const video = resources;

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

function getYouTubeVideoId(input) {
  const s = String(input || "").trim();
  const patterns = [
    /[?&]v=([A-Za-z0-9_-]{11})/,
    /youtu\.be\/([A-Za-z0-9_-]{11})/,
    /\/(shorts|embed|live)\/([A-Za-z0-9_-]{11})/,
  ];
  for (const re of patterns) {
    const m = s.match(re);
    if (m) return m[1];
  }
  return /^[A-Za-z0-9_-]{11}$/.test(s) ? s : null;
}

// ---- YouTube Direct / Innertube Fallback (bypasses datacenter HTML bot wall) ----
async function fetchYouTubeDirect(videoId, cookieHeader = null) {
  try {
    let visitorData = null;
    try {
      const swRes = await httpsGet(
        "https://www.youtube.com/sw.js_data",
        cookieHeader ? { Cookie: cookieHeader } : {},
      );
      if (swRes.status === 200) {
        let swText = swRes.text;
        if (swText.startsWith(")]}'")) swText = swText.slice(4);
        const swData = JSON.parse(swText);
        visitorData = swData?.[0]?.[2]?.[0]?.[0]?.[13];
      }
    } catch {}

    const clients = [
      {
        clientName: "ANDROID",
        clientVersion: "20.10.38",
        androidSdkVersion: 31,
        osName: "Android",
        osVersion: "12",
        hl: "en",
        userAgent: "com.google.android.youtube/20.10.38 (Linux; U; ANDROID 11) gzip",
        isMobile: true,
      },
      {
        clientName: "IOS",
        clientVersion: "19.29.1",
        deviceMake: "Apple",
        deviceModel: "iPhone16,2",
        osName: "iOS",
        osVersion: "17.5.1.21F90",
        hl: "en",
        userAgent: "com.google.ios.youtube/19.29.1 (iPhone16,2; U; CPU iOS 17_5_1 like Mac OS X; en_US)",
        isMobile: true,
      },
      {
        clientName: "VISIONOS",
        clientVersion: "1.02",
        deviceMake: "Apple",
        deviceModel: "RealityDevice17,1",
        osName: "visionOS",
        osVersion: "26.5.23O471",
        ...(visitorData ? { visitorData } : {}),
        hl: "en",
        userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15",
        isMobile: false,
      },
      {
        clientName: "WEB",
        clientVersion: "2.20241021.01.00",
        hl: "en",
        gl: "US",
        ...(visitorData ? { visitorData } : {}),
        userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
        isMobile: false,
      },
    ];

    for (const client of clients) {
      const sapisidHash = client.isMobile ? null : getSapisidHash(cookieHeader);
      let pJson = null;
      try {
        const extraHeaders = {
          "User-Agent": client.userAgent,
          ...(cookieHeader && !client.isMobile ? { Cookie: cookieHeader } : {}),
          ...(sapisidHash ? { Authorization: sapisidHash } : {}),
        };
        if (client.clientName === "WEB") {
          extraHeaders["X-YouTube-Client-Name"] = "1";
          extraHeaders["X-YouTube-Client-Version"] = "2.20241021.01.00";
          extraHeaders["Origin"] = "https://www.youtube.com";
          extraHeaders["Referer"] = "https://www.youtube.com/";
        }
        const { userAgent, isMobile, ...clientPayload } = client;
        const res = await innertubePost(
          {
            videoId,
            contentCheckOk: true,
            racyCheckOk: true,
            context: { client: clientPayload },
          },
          extraHeaders,
        );
        if (res.status !== 200 || !res.data) continue;
        pJson = res.data;
      } catch {
        continue;
      }
      const status = pJson?.playabilityStatus?.status;
      if (status !== "OK") continue;

      const details = pJson.videoDetails || {};
      const sd = pJson.streamingData || {};
      const title = details.title || "YouTube Video";
      const uploader = details.author || null;
      const duration = Number(details.lengthSeconds) || null;
      const thumbs = details.thumbnail?.thumbnails || [];
      const thumbnail = thumbs.length ? thumbs[thumbs.length - 1].url : null;

      const formats = [...(sd.formats || []), ...(sd.adaptiveFormats || [])];
      const byHeight = new Map();
      let bestAudio = null;

      for (const f of formats) {
        if (!f.url) continue;
        const isVideo = f.mimeType?.startsWith("video/");
        const isAudio = f.mimeType?.startsWith("audio/");
        const hasBoth =
          f.mimeType?.includes("video/") && (f.audioChannels || f.audioQuality);
        const height =
          f.height || (f.qualityLabel ? parseInt(f.qualityLabel, 10) : 0);
        const size = Number(f.contentLength) || 0;

        if (isVideo && height > 0) {
          const isMp4 = f.mimeType?.includes("video/mp4");
          const cur = byHeight.get(height);
          const score = (hasBoth ? 1e16 : 0) + (isMp4 ? 1e15 : 0) + size;
          const curScore = cur
            ? (cur.hasAudio ? 1e16 : 0) + (cur.isMp4 ? 1e15 : 0) + (cur.size || 0)
            : -1;
          if (score > curScore) {
            byHeight.set(height, {
              id: `ye_${f.itag}`,
              quality: height,
              ext: isMp4 ? "mp4" : "webm",
              size,
              sizeLabel: fmtBytes(size),
              hasAudio: !!hasBoth,
              fps: f.fps || null,
              directUrl: f.url,
              isMp4,
              itag: f.itag,
            });
          }
        } else if (isAudio) {
          const bitrate = f.bitrate || 0;
          const isM4a = f.mimeType?.includes("audio/mp4");
          if (!bestAudio || (isM4a && !bestAudio.isM4a) || bitrate > (bestAudio.bitrate || 0)) {
            bestAudio = {
              id: `ye_${f.itag}`,
              quality: 0,
              ext: "mp3",
              size,
              sizeLabel: fmtBytes(size),
              hasAudio: true,
              fps: null,
              audioOnly: true,
              bitrate,
              directUrl: f.url,
              isM4a,
              itag: f.itag,
            };
          }
        }
      }

      const resources = [...byHeight.values()].sort(
        (a, b) => b.quality - a.quality,
      );
      if (!bestAudio) {
        const muxedVideo = resources.find((r) => r.hasAudio && r.directUrl);
        if (muxedVideo) {
          bestAudio = {
            id: "audio",
            quality: 0,
            ext: "mp3",
            size: muxedVideo.size,
            sizeLabel: muxedVideo.sizeLabel,
            hasAudio: true,
            fps: null,
            audioOnly: true,
            bitrate: 128000,
            directUrl: muxedVideo.directUrl,
            isMp4: true,
          };
        }
      }
      if (bestAudio) resources.push(bestAudio);

      if (resources.length > 0) {
        return {
          title,
          thumbnail,
          duration,
          uploader,
          isLive: false,
          resources,
          qualities: resources.filter((r) => !r.audioOnly).map((r) => r.quality),
          hasAudio: resources.some((r) => r.audioOnly || r.hasAudio),
          cookies: false,
          source: `Innertube-${client.clientName}`,
          audioDirectUrl: bestAudio?.directUrl || null,
        };
      }
    }
  } catch (err) {
    console.error("[fetchYouTubeDirect] error:", err.message);
  }
  return null;
}

// ---- Instagram Direct Fallback (when datacenter IP triggers empty media response) ----
async function fetchInstagramDirect(url) {
  const m = String(url).match(/(?:reel|reels|p|share\/reel|share\/p)\/([A-Za-z0-9_-]+)/i);
  if (!m) return null;
  const shortcode = m[1];
  try {
    const res = await fetch(`https://www.instagram.com/p/${shortcode}/embed/captioned/`, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
    });
    if (!res.ok) return null;
    const html = await res.text();
    const vm = html.match(/"video_url"\s*:\s*"([^"]+)"/);
    if (!vm) return null;
    let videoUrl = vm[1].replace(/\\u0026/g, "&").replace(/\\\//g, "/");
    try {
      videoUrl = JSON.parse(`"${vm[1]}"`);
    } catch {}

    let thumbnail = null;
    const tm = html.match(/"display_url"\s*:\s*"([^"]+)"/);
    if (tm) {
      thumbnail = tm[1].replace(/\\u0026/g, "&").replace(/\\\//g, "/");
    }

    let title = "Instagram Reel";
    const cm = html.match(/<div[^>]+class="EmbeddedMediaCaption"[^>]*>(.*?)<\/div>/s);
    if (cm) {
      const clean = cm[1].replace(/<[^>]+>/g, " ").trim();
      if (clean) title = clean.slice(0, 80);
    }

    let uploader = null;
    const um = html.match(/class="EmbeddedMediaUser-username"[^>]*>([^<]+)</);
    if (um) uploader = um[1].trim();

    return {
      title,
      thumbnail,
      duration: null,
      uploader,
      isLive: false,
      resources: [
        {
          id: `ig_${shortcode}`,
          quality: 720,
          ext: "mp4",
          size: 0,
          sizeLabel: "HD",
          hasAudio: true,
          fps: 30,
        },
      ],
      qualities: [720],
      hasAudio: true,
      cookies: false,
      directUrl: videoUrl,
    };
  } catch {
    return null;
  }
}

// ---- routes ----
app.get(["/", "/health"], (req, res) => {
  let cookiesFileBytes = 0;
  try {
    if (fs.existsSync(COOKIES_PATH)) {
      cookiesFileBytes = fs.statSync(COOKIES_PATH).size;
    }
  } catch {}
  res.json({
    ok: true,
    service: "toolverse-yt-backend",
    version: "2.5.0",
    innertubeDirect: true,
    ytDlpVersion,
    cookies: HAS_COOKIES,
    cookiesFileBytes,
    hasServerCookieHeader: !!SERVER_COOKIE_HEADER,
    cookieHeaderLen: SERVER_COOKIE_HEADER ? SERVER_COOKIE_HEADER.length : 0,
    maxMinutes: Number(process.env.MAX_MINUTES || 10),
  });
});

app.get("/api/debug-player", async (req, res) => {
  const videoId = String(req.query.v || "Ph9WRhlPacY").trim();
  const activeCookieHeader = SERVER_COOKIE_HEADER;
  const sapisidHash = getSapisidHash(activeCookieHeader);

  let swStatus = null;
  let swLength = 0;
  let visitorData = null;
  try {
    const swRes = await httpsGet(
      "https://www.youtube.com/sw.js_data",
      activeCookieHeader ? { Cookie: activeCookieHeader } : {},
    );
    swStatus = swRes.status;
    swLength = swRes.text ? swRes.text.length : 0;
    let swText = swRes.text;
    if (swText.startsWith(")]}'")) swText = swText.slice(4);
    const swData = JSON.parse(swText);
    visitorData = swData?.[0]?.[2]?.[0]?.[0]?.[13];
  } catch (e) {
    swStatus = e.message;
  }

  const clients = [
    { clientName: "WEB", clientVersion: "2.20241021.01.00", hl: "en", gl: "US", ...(visitorData ? { visitorData } : {}) },
    { clientName: "ANDROID", clientVersion: "21.26.364", androidSdkVersion: 30, osName: "Android", osVersion: "11", ...(visitorData ? { visitorData } : {}), hl: "en" },
    { clientName: "VISIONOS", clientVersion: "1.02", deviceMake: "Apple", deviceModel: "RealityDevice17,1", osName: "visionOS", osVersion: "26.5.23O471", ...(visitorData ? { visitorData } : {}), hl: "en" },
    { clientName: "TVHTML5_SIMPLY_EMBEDDED_PLAYER", clientVersion: "2.0", hl: "en" },
  ];

  const results = [];
  for (const client of clients) {
    for (const withAuth of [true, false]) {
      const extraHeaders = {
        ...(activeCookieHeader ? { Cookie: activeCookieHeader } : {}),
        ...(withAuth && sapisidHash ? { Authorization: sapisidHash } : {}),
        "Origin": "https://www.youtube.com",
        "Referer": "https://www.youtube.com/",
      };
      if (client.clientName === "WEB") {
        extraHeaders["X-YouTube-Client-Name"] = "1";
        extraHeaders["X-YouTube-Client-Version"] = "2.20241021.01.00";
      }

      try {
        const resp = await innertubePost(
          { videoId, contentCheckOk: true, racyCheckOk: true, context: { client } },
          extraHeaders,
        );
        const ps = resp.data?.playabilityStatus;
        const sd = resp.data?.streamingData;
        const allFormats = [...(sd?.formats || []), ...(sd?.adaptiveFormats || [])];
        results.push({
          client: client.clientName,
          withAuth,
          httpStatus: resp.status,
          playability: ps?.status || null,
          reason: ps?.reason || null,
          formatsCount: allFormats.length,
          directUrlsCount: allFormats.filter((f) => f.url).length,
          rawError: resp.status !== 200 ? (resp.data || resp.text) : null,
        });
      } catch (err) {
        results.push({
          client: client.clientName,
          withAuth,
          error: err.message,
        });
      }
    }
  }

  res.json({
    videoId,
    hasServerCookies: HAS_COOKIES,
    cookieHeaderLen: activeCookieHeader ? activeCookieHeader.length : 0,
    hasSapisidHash: !!sapisidHash,
    swStatus,
    swLength,
    hasVisitorData: !!visitorData,
    results,
  });
});

app.get("/api/debug-ytdlp", async (req, res) => {
  const videoId = String(req.query.v || "Ph9WRhlPacY").trim();
  const testUrl = `https://www.youtube.com/watch?v=${videoId}`;
  const startTime = Date.now();
  try {
    const fullArgs = [
      "--verbose",
      "--force-ipv4",
      "--js-runtimes",
      "node",
      ...(HAS_COOKIES ? ["--cookies", COOKIES_PATH] : []),
      "--geo-bypass",
      "--no-check-certificates",
      "--socket-timeout",
      "8",
      "--dump-json",
      "--no-playlist",
      testUrl,
    ];
    const proc = spawn("yt-dlp", fullArgs, {
      timeout: 12000,
      env: {
        ...process.env,
        PATH: `/usr/local/bin:/usr/bin:/bin:${process.env.PATH || ""}`,
      },
    });
    let stdout = "";
    let stderr = "";
    proc.stdout.on("data", (d) => { stdout += d; });
    proc.stderr.on("data", (d) => { stderr += d; });
    proc.on("close", (code, signal) => {
      res.json({
        durationMs: Date.now() - startTime,
        exitCode: code,
        signal,
        stdoutLength: stdout.length,
        stderr: stderr.split("\n").filter(Boolean),
      });
    });
    proc.on("error", (err) => {
      res.json({
        durationMs: Date.now() - startTime,
        error: err.message,
        stderr: stderr.split("\n").filter(Boolean),
      });
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Video metadata + full resource table.
app.post("/api/info", rateLimit(30), async (req, res) => {
  const { url, cookies } = req.body || {};
  if (!isValidUrl(url)) {
    return res.status(400).json({ error: "A valid video URL is required." });
  }
  const key = normalizeUrl(url);

  let tempCookiePath = null;
  let cookieHeader = null;
  if (cookies && typeof cookies === "string" && cookies.trim()) {
    try {
      let rawText = cookies.trim();
      if (!rawText.startsWith("#") && !rawText.includes("\t")) {
        try {
          const decoded = Buffer.from(rawText, "base64").toString("utf8");
          if (decoded.includes("\t") || decoded.includes("youtube.com")) {
            rawText = decoded;
          }
        } catch {}
      }
      cookieHeader = netscapeToCookieHeader(rawText);
      rawText = rawText.replace(/\r\n/g, "\n").trim() + "\n";
      tempCookiePath = path.join(TMPDIR, `cookies-${crypto.randomBytes(6).toString("hex")}.txt`);
      await fsp.writeFile(tempCookiePath, rawText, { mode: 0o600 });
      console.log(`[cookies] wrote ${rawText.length} bytes to ${tempCookiePath}`);
    } catch (cookieErr) {
      console.error("[cookies] failed to write temp cookies:", cookieErr);
    }
  }

  // Visitor-cookie requests are never served from/written to the shared cache
  if (!tempCookiePath) {
    const cached = parseCache.get(key);
    if (cached && cached.expires > Date.now()) {
      return res.json({ ...cached.data, cached: true });
    }
  }

  const activeCookieHeader = cookieHeader || SERVER_COOKIE_HEADER;

  // Fast direct Innertube resolution for YouTube (bypasses datacenter IP HTML bot wall)
  const vid = getYouTubeVideoId(key);
  let directFallback = null;
  if (vid) {
    const directYt = await fetchYouTubeDirect(vid, activeCookieHeader);
    if (directYt) {
      const vidQualities = directYt.resources?.filter((r) => !r.audioOnly) || [];
      if (vidQualities.length > 1) {
        if (!tempCookiePath) {
          parseCache.set(key, { data: directYt, expires: Date.now() + CACHE_MS });
        }
        return res.json(directYt);
      }
      directFallback = directYt;
    }
  }

  // Fast direct fallback for Instagram
  if (key.includes("instagram.com/") || key.includes("instagr.am/")) {
    const ig = await fetchInstagramDirect(key);
    if (ig) {
      if (!tempCookiePath) parseCache.set(key, { data: ig, expires: Date.now() + CACHE_MS });
      return res.json(ig);
    }
  }

  try {
    const { stdout } = await runYtDlpWithFallback(
      ["--dump-json", "--no-playlist", "--no-warnings", key],
      60000,
      tempCookiePath,
      key,
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
      cookies: HAS_COOKIES || !!tempCookiePath,
    };
    if (!tempCookiePath) {
      parseCache.set(key, { data, expires: Date.now() + CACHE_MS });
    }
    res.json(data);
  } catch (e) {
    if (directFallback) {
      if (!tempCookiePath) parseCache.set(key, { data: directFallback, expires: Date.now() + CACHE_MS });
      return res.json(directFallback);
    }
    if (vid) {
      const directYt = await fetchYouTubeDirect(vid, cookieHeader || SERVER_COOKIE_HEADER);
      if (directYt) {
        if (!tempCookiePath) parseCache.set(key, { data: directYt, expires: Date.now() + CACHE_MS });
        return res.json(directYt);
      }
    }
    if (key.includes("instagram.com/") || key.includes("instagr.am/")) {
      const ig = await fetchInstagramDirect(key);
      if (ig) {
        if (!tempCookiePath) parseCache.set(key, { data: ig, expires: Date.now() + CACHE_MS });
        return res.json(ig);
      }
    }
    res.status(502).json({
      error: "Could not fetch video info.",
      detail: String((e && e.message) || e).slice(0, 200),
      hint: HAS_COOKIES || tempCookiePath
        ? undefined
        : "Try adding your cookies in 'Blocked? Use your own YouTube cookies' below.",
    });
  } finally {
    if (tempCookiePath) {
      fsp.unlink(tempCookiePath).catch(() => {});
    }
  }
});

// Download a specific resource (or auto-pick by quality / audio flag).
app.get("/api/download", rateLimit(20), async (req, res) => {
  const { url, format_id, quality, audio, audio_format, cookies } = req.query;
  if (!isValidUrl(url)) {
    return res.status(400).json({ error: "A valid video URL is required." });
  }
  const audioOnly = audio === "1";
  const key = normalizeUrl(url);

  let tempCookiePath = null;
  let cookieHeader = null;
  if (cookies && typeof cookies === "string" && cookies.trim()) {
    try {
      let rawText = cookies.trim();
      if (!rawText.startsWith("#") && !rawText.includes("\t")) {
        try {
          const decoded = Buffer.from(rawText, "base64").toString("utf8");
          if (decoded.includes("\t") || decoded.includes("youtube.com")) {
            rawText = decoded;
          }
        } catch {}
      }
      cookieHeader = netscapeToCookieHeader(rawText);
      rawText = rawText.replace(/\r\n/g, "\n").trim() + "\n";
      tempCookiePath = path.join(TMPDIR, `cookies-${crypto.randomBytes(6).toString("hex")}.txt`);
      await fsp.writeFile(tempCookiePath, rawText, { mode: 0o600 });
    } catch {}
  }

  // Handle direct Instagram stream if fetched via direct fallback
  if (format_id && String(format_id).startsWith("ig_")) {
    let directUrl = parseCache.get(key)?.data?.directUrl;
    let title = parseCache.get(key)?.data?.title || "instagram_reel";
    if (!directUrl) {
      const ig = await fetchInstagramDirect(key);
      if (ig?.directUrl) {
        directUrl = ig.directUrl;
        title = ig.title || title;
      }
    }
    if (directUrl) {
      try {
        const streamRes = await fetch(directUrl);
        if (streamRes.ok) {
          const filename = `${sanitizeFilename(title)}.mp4`;
          res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
          res.setHeader("Content-Type", "video/mp4");
          const { Readable } = require("stream");
          Readable.fromWeb(streamRes.body).pipe(res);
          if (tempCookiePath) fsp.unlink(tempCookiePath).catch(() => {});
          return;
        }
      } catch (streamErr) {
        console.error("Direct stream failed:", streamErr);
      }
    }
  }

  // Handle direct YouTube Innertube stream
  const ytVid = getYouTubeVideoId(key);
  if (ytVid && (String(format_id || "").startsWith("ye_") || audioOnly || !format_id)) {
    let cached = parseCache.get(key)?.data;
    if (!cached || !cached.resources) {
      cached = await fetchYouTubeDirect(ytVid, cookieHeader || SERVER_COOKIE_HEADER);
    }
    const audioResource = cached?.resources?.find((r) => r.audioOnly);
    let targetResource = cached?.resources?.find((r) => r.id === format_id);
    if (!targetResource && quality) {
      const q = parseInt(quality, 10);
      const vids = (cached?.resources || []).filter((r) => !r.audioOnly);
      targetResource = vids.find((r) => r.quality <= q) || vids[0];
    }
    const title = cached?.title || "youtube_video";

    if (audioOnly || targetResource?.audioOnly) {
      const audioUrl = (targetResource?.audioOnly ? targetResource.directUrl : null) || audioResource?.directUrl || cached?.audioDirectUrl;
      if (audioUrl) {
        const af = ["mp3", "ogg", "opus", "wav", "m4a"].includes(String(audio_format))
          ? String(audio_format)
          : "mp3";
        const filename = `${sanitizeFilename(title)}.${af}`;
        res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
        const audioUa = audioUrl.includes("c=ANDROID")
          ? "com.google.android.youtube/20.10.38 (Linux; U; ANDROID 11) gzip"
          : audioUrl.includes("c=IOS")
          ? "com.google.ios.youtube/19.29.1 (iPhone16,2; U; CPU iOS 17_5_1 like Mac OS X; en_US)"
          : audioUrl.includes("c=VISIONOS")
          ? "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15"
          : "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";
        const browserHeaders = `User-Agent: ${audioUa}\r\nReferer: https://www.youtube.com/\r\n`;
        if (af === "m4a" && audioResource?.isM4a) {
          res.setHeader("Content-Type", "audio/mp4");
          const ff = spawn("ffmpeg", [
            "-headers",
            browserHeaders,
            "-i",
            audioUrl,
            "-vn",
            "-c:a",
            "copy",
            "-movflags",
            "frag_keyframe+empty_moov+default_base_moof",
            "-f",
            "mp4",
            "pipe:1",
          ]);
          ff.stdout.pipe(res);
          ff.stderr.on("data", () => {});
          req.on("close", () => ff.kill());
          if (tempCookiePath) fsp.unlink(tempCookiePath).catch(() => {});
          return;
        } else {
          res.setHeader("Content-Type", "audio/mpeg");
          const ff = spawn("ffmpeg", [
            "-headers",
            browserHeaders,
            "-i",
            audioUrl,
            "-vn",
            "-acodec",
            "libmp3lame",
            "-b:a",
            "192k",
            "-f",
            "mp3",
            "pipe:1",
          ]);
          ff.stdout.pipe(res);
          ff.stderr.on("data", () => {});
          req.on("close", () => ff.kill());
          if (tempCookiePath) fsp.unlink(tempCookiePath).catch(() => {});
          return;
        }
      }
    }

    if (targetResource?.directUrl) {
      const ext = targetResource.ext || "mp4";
      const filename = `${sanitizeFilename(title)}.${ext}`;
      const vUa = targetResource.directUrl.includes("c=ANDROID")
        ? "com.google.android.youtube/20.10.38 (Linux; U; ANDROID 11) gzip"
        : targetResource.directUrl.includes("c=IOS")
        ? "com.google.ios.youtube/19.29.1 (iPhone16,2; U; CPU iOS 17_5_1 like Mac OS X; en_US)"
        : targetResource.directUrl.includes("c=VISIONOS")
        ? "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15"
        : "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";
      const vHeaders = `User-Agent: ${vUa}\r\nReferer: https://www.youtube.com/\r\n`;

      if (targetResource.hasAudio) {
        try {
          const sRes = await fetch(targetResource.directUrl, {
            headers: {
              "User-Agent": vUa,
              Referer: "https://www.youtube.com/",
            },
          });
          if (sRes.ok) {
            res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
            res.setHeader("Content-Type", ext === "webm" ? "video/webm" : "video/mp4");
            const { Readable } = require("stream");
            Readable.fromWeb(sRes.body).pipe(res);
            if (tempCookiePath) fsp.unlink(tempCookiePath).catch(() => {});
            return;
          }
        } catch {}
      }

      const audioUrl = audioResource?.directUrl || cached?.audioDirectUrl;
      const aUa = (audioUrl || "").includes("c=ANDROID")
        ? "com.google.android.youtube/20.10.38 (Linux; U; ANDROID 11) gzip"
        : (audioUrl || "").includes("c=IOS")
        ? "com.google.ios.youtube/19.29.1 (iPhone16,2; U; CPU iOS 17_5_1 like Mac OS X; en_US)"
        : "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";
      const aHeaders = `User-Agent: ${aUa}\r\nReferer: https://www.youtube.com/\r\n`;

      res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
      res.setHeader("Content-Type", "video/mp4");
      const ffArgs = audioUrl
        ? [
            "-headers",
            vHeaders,
            "-i",
            targetResource.directUrl,
            "-headers",
            aHeaders,
            "-i",
            audioUrl,
            "-c:v",
            "copy",
            "-c:a",
            "aac",
            "-movflags",
            "frag_keyframe+empty_moov+default_base_moof",
            "-f",
            "mp4",
            "pipe:1",
          ]
        : [
            "-headers",
            vHeaders,
            "-i",
            targetResource.directUrl,
            "-c",
            "copy",
            "-movflags",
            "frag_keyframe+empty_moov+default_base_moof",
            "-f",
            "mp4",
            "pipe:1",
          ];
      const ff = spawn("ffmpeg", ffArgs);
      ff.stdout.pipe(res);
      ff.stderr.on("data", () => {});
      req.on("close", () => ff.kill());
      if (tempCookiePath) fsp.unlink(tempCookiePath).catch(() => {});
      return;
    }
  }

  const id = crypto.randomBytes(8).toString("hex");
  const outTmpl = path.join(TMPDIR, `tvdl-${id}.%(ext)s`);

  let args;
  if (audioOnly) {
    const af = ["mp3", "ogg", "opus", "wav", "m4a"].includes(String(audio_format))
      ? String(audio_format)
      : "mp3";
    args = ["-f", "ba/ba*/b/best", "-x", "--audio-format", af, "--audio-quality", "0"];
  } else if (format_id && /^[A-Za-z0-9_-]+$/.test(String(format_id))) {
    // Exact resource from /api/info; merge with best audio when needed.
    const cleanId = String(format_id).replace(/^ye_/, "");
    args = [
      "-f",
      `${cleanId}+bestaudio/best`,
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
    if (tempCookiePath) fsp.unlink(tempCookiePath).catch(() => {});
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
    await runYtDlpWithFallback(
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
        key,
      ],
      MAX_MS,
      tempCookiePath,
      key,
    );

    const files = (await fsp.readdir(TMPDIR)).filter((f) =>
      f.startsWith(`tvdl-${id}.`),
    );
    if (!files.length) throw new Error("download produced no file");
    const filePath = path.join(TMPDIR, files[0]);

    let title = "download";
    try {
      const r = await runYtDlpWithFallback(
        ["--print", "%(title)s", "--no-playlist", "--no-warnings", key],
        30000,
        tempCookiePath,
        key,
      );
      const t = r.stdout.trim().split("\n")[0];
      if (t) title = t;
    } catch {
      /* non-fatal */
    }

    const ext = audioOnly ? "mp3" : "mp4";
    const filename = `${sanitizeFilename(title)}.${ext}`;
    const cleanup = () => {
      if (tempCookiePath) fsp.unlink(tempCookiePath).catch(() => {});
      fsp.unlink(filePath).catch(() => {});
    };
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