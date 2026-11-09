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

const PROXY_URL = (process.env.PROXY_URL || "").trim();
let proxyDispatcher = undefined;
let proxyInitError = null;
if (PROXY_URL) {
  try {
    const { ProxyAgent } = require("undici");
    proxyDispatcher = new ProxyAgent(PROXY_URL);
    console.log(
      "[proxy] Fetch proxy enabled:",
      PROXY_URL.replace(/:[^:@]+@/, ":***@"),
    );
  } catch (err) {
    proxyInitError = err.message;
    console.error("[proxy] Failed to initialize ProxyAgent:", err.message);
  }
}

async function httpsGet(urlStr, headers = {}) {
  try {
    const res = await fetch(urlStr, {
      headers: {
        "User-Agent":
          "com.google.android.youtube/20.10.38 (Linux; U; ANDROID 11) gzip",
        Accept: "application/json",
        ...headers,
      },
      signal: AbortSignal.timeout(8000),
      ...(proxyDispatcher ? { dispatcher: proxyDispatcher } : {}),
    });
    const text = await res.text();
    return { status: res.status, text };
  } catch (err) {
    return { status: 500, text: "", error: err.message };
  }
}

async function innertubePost(payload, headers = {}) {
  try {
    const res = await fetch(
      "https://www.youtube.com/youtubei/v1/player?key=AIzaSyAO_FJ2SlqU8Q4STEHLGCilw_Y9_11qcW8&hl=en",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "User-Agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
          ...headers,
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(10000),
        ...(proxyDispatcher ? { dispatcher: proxyDispatcher } : {}),
      },
    );
    const text = await res.text();
    try {
      return { status: res.status, data: JSON.parse(text) };
    } catch (parseErr) {
      return { status: res.status, text, error: parseErr.message };
    }
  } catch (err) {
    return { status: 500, text: "", error: err.message };
  }
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

function formatAsNetscapeCookies(rawInput, isInstagram = false) {
  if (!rawInput || typeof rawInput !== "string") return null;
  let text = rawInput.trim();
  try {
    const decoded = Buffer.from(text, "base64").toString("utf8");
    if (decoded.includes("\t") || decoded.startsWith("#") || decoded.includes("=")) {
      text = decoded.trim();
    }
  } catch {}

  if (text.startsWith("#") || text.includes("\t")) {
    return text.replace(/\r\n/g, "\n").trim() + "\n";
  }

  const domain = isInstagram ? ".instagram.com" : ".youtube.com";

  // Check if JSON array (exported by some browser extensions)
  if (text.startsWith("[") && text.endsWith("]")) {
    try {
      const arr = JSON.parse(text);
      if (Array.isArray(arr)) {
        const rows = ["# Netscape HTTP Cookie File"];
        for (const item of arr) {
          if (item && item.name && item.value) {
            const d = item.domain || domain;
            rows.push(`${d}\tTRUE\t${item.path || "/"}\t${item.secure ? "TRUE" : "FALSE"}\t2147483647\t${item.name}\t${item.value}`);
          }
        }
        return rows.join("\n") + "\n";
      }
    } catch {}
  }

  if (isInstagram) {
    const rows = ["# Netscape HTTP Cookie File"];
    const cookieMap = new Map();
    if (!text.includes("=") && text.length > 8) {
      cookieMap.set("sessionid", text.trim());
    } else {
      const pairs = text.split(";");
      for (const pair of pairs) {
        const eq = pair.indexOf("=");
        if (eq > 0) {
          const k = pair.slice(0, eq).trim();
          const v = pair.slice(eq + 1).trim();
          if (k && v) cookieMap.set(k, v);
        }
      }
    }

    const sessionVal = cookieMap.get("sessionid");
    if (sessionVal && !cookieMap.has("ds_user_id")) {
      try {
        const uid = decodeURIComponent(sessionVal).split(":")[0];
        if (uid && /^\d+$/.test(uid)) {
          cookieMap.set("ds_user_id", uid);
        }
      } catch {}
    }

    if (!cookieMap.has("csrftoken")) {
      cookieMap.set("csrftoken", crypto.randomBytes(16).toString("hex"));
    }
    if (!cookieMap.has("mid")) {
      cookieMap.set("mid", crypto.randomBytes(16).toString("base64url"));
    }
    if (!cookieMap.has("ig_did")) {
      cookieMap.set("ig_did", crypto.randomUUID().toUpperCase());
    }
    if (!cookieMap.has("rur")) {
      cookieMap.set("rur", "NAO");
    }

    for (const [k, v] of cookieMap.entries()) {
      rows.push(`.instagram.com\tTRUE\t/\tTRUE\t2147483647\t${k}\t${v}`);
    }
    return rows.join("\n") + "\n";
  }

  // Key-value pairs or single sessionid for other domains
  const rows = ["# Netscape HTTP Cookie File"];
  if (!text.includes("=") && text.length > 8) {
    rows.push(`${domain}\tTRUE\t/\tTRUE\t2147483647\tsessionid\t${text}`);
  } else {
    const pairs = text.split(";");
    for (const pair of pairs) {
      const eq = pair.indexOf("=");
      if (eq > 0) {
        const k = pair.slice(0, eq).trim();
        const v = pair.slice(eq + 1).trim();
        if (k && v) {
          rows.push(`${domain}\tTRUE\t/\tTRUE\t2147483647\t${k}\t${v}`);
        }
      }
    }
  }
  return rows.length > 1 ? rows.join("\n") + "\n" : (text.replace(/\r\n/g, "\n").trim() + "\n");
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

// Cookies can arrive via Render Secret Files, base64 env vars, or plain IG_SESSIONID
const RENDER_SECRET_COOKIES = "/etc/secrets/cookies.txt";
if (fs.existsSync(RENDER_SECRET_COOKIES)) {
  try {
    const raw = fs.readFileSync(RENDER_SECRET_COOKIES, "utf8");
    fs.writeFileSync(COOKIES_PATH, raw, { mode: 0o600 });
    console.log(`[cookies] loaded Render secret file from ${RENDER_SECRET_COOKIES}`);
  } catch (e) {
    console.error("[cookies] could not load Render secret file:", e.message);
  }
}

if (process.env.COOKIES_B64) {
  try {
    const cleanB64 = process.env.COOKIES_B64.trim().replace(/^["']|["']$/g, "");
    const decoded = Buffer.from(cleanB64, "base64");
    if (fs.existsSync(COOKIES_PATH)) {
      fs.appendFileSync(COOKIES_PATH, "\n" + decoded.toString("utf8"), { mode: 0o600 });
    } else {
      fs.writeFileSync(COOKIES_PATH, decoded, { mode: 0o600 });
    }
    console.log(`[cookies] wrote COOKIES_B64 bytes to ${COOKIES_PATH}`);
  } catch (e) {
    console.error("[cookies] could not write COOKIES_B64:", String(e).slice(0, 120));
  }
}

if (process.env.IG_COOKIES_B64) {
  try {
    const cleanB64 = process.env.IG_COOKIES_B64.trim().replace(/^["']|["']$/g, "");
    const decoded = Buffer.from(cleanB64, "base64").toString("utf8");
    const netscape = formatAsNetscapeCookies(decoded, true);
    if (netscape) {
      if (fs.existsSync(COOKIES_PATH)) {
        fs.appendFileSync(COOKIES_PATH, "\n" + netscape, { mode: 0o600 });
      } else {
        fs.writeFileSync(COOKIES_PATH, netscape, { mode: 0o600 });
      }
      console.log(`[cookies] appended IG_COOKIES_B64 to ${COOKIES_PATH}`);
    }
  } catch (e) {
    console.error("[cookies] could not write IG_COOKIES_B64:", String(e).slice(0, 120));
  }
}

const DEFAULT_IG_SESSION = "26746336962%3Aa9pwQq3SnBsDQN%3A21%3AAYkNh5jlqiuMMVgF1ySmLrj8tCOYZcLQLo7ikCPGcQ";
const rawIgInput = (process.env.IG_SESSIONID || process.env.IG_COOKIES || DEFAULT_IG_SESSION).trim().replace(/^["']|["']$/g, "");

let existingCookieContent = "";
try {
  if (fs.existsSync(COOKIES_PATH)) {
    existingCookieContent = fs.readFileSync(COOKIES_PATH, "utf8");
  }
} catch {}

const hasActiveIgInCookies = existingCookieContent.includes(".instagram.com") && existingCookieContent.includes("sessionid");

if (!hasActiveIgInCookies && rawIgInput) {
  try {
    const netscape = formatAsNetscapeCookies(rawIgInput, true);
    if (netscape) {
      if (fs.existsSync(COOKIES_PATH)) {
        fs.appendFileSync(COOKIES_PATH, "\n" + netscape, { mode: 0o600 });
      } else {
        fs.writeFileSync(COOKIES_PATH, netscape, { mode: 0o600 });
      }
      console.log(`[cookies] appended Instagram session cookies to ${COOKIES_PATH}`);
    }
  } catch (e) {
    console.error("[cookies] could not write IG session:", String(e).slice(0, 120));
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
function runYtDlp(args, timeoutMs, customCookiesPath, options = {}) {
  return new Promise((resolve, reject) => {
    const cookiesToUse = customCookiesPath || (HAS_COOKIES ? COOKIES_PATH : null);
    const useProxy = options.noProxy ? false : Boolean(PROXY_URL);
    const isIg = Boolean(options.isIg) || args.some((a) => /instagram\.com|instagr\.am/i.test(a));
    const geoArgs = (!isIg && !options.noGeo) ? ["--geo-bypass", "--geo-bypass-country", "IN"] : [];
    const uaArgs = (!options.noUserAgent && !isIg)
      ? ["--user-agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36"]
      : [];

    const fullArgs = [
      "--force-ipv4",
      "--js-runtimes",
      "node",
      ...(useProxy ? ["--proxy", PROXY_URL] : []),
      ...(cookiesToUse ? ["--cookies", cookiesToUse] : []),
      ...geoArgs,
      "--no-check-certificates",
      ...uaArgs,
      "--socket-timeout",
      "15",
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
      const hasValidJsonStdout =
        Boolean(stdout && stdout.trim().length > 0) &&
        /"id":|"thumbnail":|"formats":|"entries":|"display_url":/.test(stdout);
      if (code === 0 || hasValidJsonStdout) {
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
      const m = u.pathname.match(/(?:reel|reels|p|tv|stories|share\/(?:reel|p))\/([A-Za-z0-9_.-]+)/i);
      if (m) {
        const type = u.pathname.includes("/reel") ? "reel" : u.pathname.includes("/tv/") ? "tv" : "p";
        if (u.pathname.includes("/stories/")) {
          return `https://www.instagram.com${u.pathname}`;
        }
        return `https://www.instagram.com/${type}/${m[1]}/`;
      }
    }
  } catch {}
  return String(rawUrl || "").trim();
}

async function runYtDlpWithFallback(args, timeoutMs, customCookiesPath, urlHint = "") {
  const isYt = /youtube\.com|youtu\.be/i.test(urlHint || args.join(" "));
  const isIg = /instagram\.com|instagr\.am/i.test(urlHint || args.join(" "));
  const isStory = /stories\//i.test(urlHint || args.join(" "));
  const isDump = args.includes("--dump-json");
  const effectiveTimeout = isStory ? Math.min(timeoutMs || 50000, 50000) : isDump ? Math.min(timeoutMs || 25000, 25000) : (timeoutMs || MAX_MS);

  if (isYt) {
    if (customCookiesPath || HAS_COOKIES) {
      const attempts = [
        [],
        ["--extractor-args", "youtube:player-client=web,web_safari"],
        ["--extractor-args", "youtube:player-client=android,web"],
      ];
      let lastErr = null;
      for (const extra of attempts) {
        try {
          return await runYtDlp([...extra, ...args], effectiveTimeout, customCookiesPath);
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
          return await runYtDlp([...extra, ...args], effectiveTimeout, customCookiesPath);
        } catch (e) {
          lastErr = e;
        }
      }
      throw lastErr;
    }
  }

  if (isIg) {
    const tryProxyFirst = Boolean(PROXY_URL);
    const attempts = tryProxyFirst
      ? [
          { noProxy: false, noUserAgent: true, isIg: true },
          { noProxy: true, noUserAgent: true, isIg: true },
          { noProxy: false, noUserAgent: false, isIg: true },
        ]
      : [
          { noProxy: true, noUserAgent: true, isIg: true },
          { noProxy: true, noUserAgent: false, isIg: true },
        ];

    let lastErr = null;
    for (const opts of attempts) {
      try {
        return await runYtDlp(args, effectiveTimeout, customCookiesPath, opts);
      } catch (e) {
        lastErr = e;
        console.warn(`[yt-dlp ig attempt failed (noProxy=${opts.noProxy})]:`, (e && e.message) || e);
      }
    }
    throw lastErr;
  }

  // Non-YouTube, non-Instagram
  return await runYtDlp(args, effectiveTimeout, customCookiesPath);
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

  // Support for photo posts and carousels
  if (video.length === 0 && (info.url || info.thumbnail || (info.thumbnails && info.thumbnails.length))) {
    const imgUrl = info.url || info.thumbnail || info.thumbnails[info.thumbnails.length - 1]?.url;
    if (imgUrl) {
      video.push({
        id: "ig_img_full",
        quality: info.height || 1080,
        ext: "jpg",
        size: 0,
        sizeLabel: "Full HD Photo",
        hasAudio: false,
        fps: null,
        isImage: true,
        directUrl: imgUrl,
      });
    }
  }

  if (info.entries && Array.isArray(info.entries) && info.entries.length) {
    info.entries.forEach((entry, idx) => {
      const eUrl = entry.url || entry.thumbnail;
      const isVid = Boolean(entry.formats && entry.formats.length);
      video.push({
        id: isVid ? `slide_vid_${idx + 1}` : `slide_img_${idx + 1}`,
        quality: entry.height || 1080,
        ext: isVid ? "mp4" : "jpg",
        size: 0,
        sizeLabel: `Slide ${idx + 1} (${isVid ? "Video" : "Photo"})`,
        hasAudio: isVid,
        fps: entry.fps || null,
        isImage: !isVid,
        directUrl: eUrl,
      });
    });
  }

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
  if (String(url).includes("/stories/")) return null;
  const m = String(url).match(/(?:reel|reels|p|tv|share\/(?:reel|p))\/([A-Za-z0-9_.-]+)/i);
  if (!m) return null;
  const shortcode = m[1];

  const fetchEmbedHtml = async (useProxy) => {
    const res = await fetch(`https://www.instagram.com/p/${shortcode}/embed/captioned/`, {
      headers: {
        "User-Agent": "facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
      signal: AbortSignal.timeout(6000),
      ...(useProxy && proxyDispatcher ? { dispatcher: proxyDispatcher } : {}),
    });
    if (!res.ok) return null;
    return await res.text();
  };

  try {
    let html = null;
    try {
      html = await fetchEmbedHtml(false);
    } catch {}
    if (!html && proxyDispatcher) {
      try {
        html = await fetchEmbedHtml(true);
      } catch {}
    }
    if (!html) return null;

    let videoUrl = null;
    const vm = html.match(/"video_url"\s*:\s*"([^"]+)"/);
    if (vm) {
      videoUrl = vm[1].replace(/\\u0026/g, "&").replace(/\\\//g, "/");
      try {
        videoUrl = JSON.parse(`"${vm[1]}"`);
      } catch {}
    }

    let thumbnail = null;
    const tm = html.match(/"display_url"\s*:\s*"([^"]+)"/);
    if (tm) {
      thumbnail = tm[1].replace(/\\u0026/g, "&").replace(/\\\//g, "/");
      try {
        thumbnail = JSON.parse(`"${tm[1]}"`);
      } catch {}
    }

    if (!thumbnail) {
      const im = html.match(/class="EmbeddedMediaImage"[^>]+src="([^"]+)"/);
      if (im) thumbnail = im[1].replace(/&amp;/g, "&");
    }

    if (!thumbnail) {
      const fallbackIm = html.match(/<img[^>]+src="([^"]+fbcdn\.net[^"]+)"/);
      if (fallbackIm) thumbnail = fallbackIm[1].replace(/&amp;/g, "&");
    }

    if (!videoUrl && !thumbnail) return null;

    let title = videoUrl ? "Instagram Video" : "Instagram Photo";
    const cm = html.match(/<div[^>]+class="EmbeddedMediaCaption"[^>]*>(.*?)<\/div>/s);
    if (cm) {
      const clean = cm[1].replace(/<[^>]+>/g, " ").trim();
      if (clean) title = clean.slice(0, 80);
    }

    let uploader = null;
    const um = html.match(/class="EmbeddedMediaUser-username"[^>]*>([^<]+)</) || html.match(/class="UsernameText"[^>]*>([^<]+)</);
    if (um) uploader = um[1].trim();

    // Extract all photos if carousel
    const allImgs = [...html.matchAll(/class="EmbeddedMediaImage"[^>]+src="([^"]+)"/g)].map((m) => m[1].replace(/&amp;/g, "&"));

    const resources = [];
    if (videoUrl) {
      resources.push({
        id: `ig_vid_${shortcode}`,
        quality: 720,
        ext: "mp4",
        size: 0,
        sizeLabel: "HD Video (MP4)",
        hasAudio: true,
        fps: 30,
        directUrl: videoUrl,
      });
    }

    if (allImgs.length > 1) {
      allImgs.forEach((img, idx) => {
        resources.push({
          id: `ig_img_${shortcode}_${idx + 1}`,
          quality: 1080,
          ext: "jpg",
          size: 0,
          sizeLabel: `Photo ${idx + 1} (JPG)`,
          hasAudio: false,
          fps: null,
          directUrl: img,
          isImage: true,
        });
      });
    } else if (thumbnail) {
      resources.push({
        id: `ig_img_${shortcode}`,
        quality: 1080,
        ext: "jpg",
        size: 0,
        sizeLabel: videoUrl ? "Cover Image (JPG)" : "HD Photo (JPG)",
        hasAudio: false,
        fps: null,
        isImage: true,
        directUrl: thumbnail,
      });
    }

    return {
      title,
      thumbnail,
      duration: null,
      uploader,
      isLive: false,
      resources,
      qualities: resources.map((r) => r.quality),
      hasAudio: Boolean(videoUrl),
      cookies: false,
      directUrl: videoUrl || thumbnail,
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
    version: "2.5.3",
    innertubeDirect: true,
    ytDlpVersion,
    cookies: HAS_COOKIES,
    cookiesFileBytes,
    hasServerCookieHeader: !!SERVER_COOKIE_HEADER,
    cookieHeaderLen: SERVER_COOKIE_HEADER ? SERVER_COOKIE_HEADER.length : 0,
    hasProxy: !!process.env.PROXY_URL,
    cachedEntries: parseCache.size,
    maxMinutes: Number(process.env.MAX_MINUTES || 10),
  });
});

app.all("/api/clear-cache", (req, res) => {
  parseCache.clear();
  res.json({ ok: true, cleared: true });
});

app.get("/api/test-embed", async (req, res) => {
  const shortcode = req.query.s || "DDPw7hYTirA";
  const results = {};
  try {
    const r1 = await fetch(`https://www.instagram.com/p/${shortcode}/embed/captioned/`, {
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36" },
      signal: AbortSignal.timeout(6000),
    });
    const t1 = await r1.text();
    results.direct = { status: r1.status, len: t1.length, title: t1.match(/<title>(.*?)<\/title>/)?.[1] };
  } catch (e) {
    results.direct = { error: e.message };
  }

  if (proxyDispatcher) {
    try {
      const r2 = await fetch(`https://www.instagram.com/p/${shortcode}/embed/captioned/`, {
        headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36" },
        signal: AbortSignal.timeout(6000),
        dispatcher: proxyDispatcher,
      });
      const t2 = await r2.text();
      results.proxy = { status: r2.status, len: t2.length, title: t2.match(/<title>(.*?)<\/title>/)?.[1] };
    } catch (e) {
      results.proxy = { error: e.message };
    }
  }

  res.json(results);
});

app.get("/api/diag", async (req, res) => {
  try {
    let rawCookies = "";
    if (fs.existsSync(COOKIES_PATH)) {
      rawCookies = fs.readFileSync(COOKIES_PATH, "utf8");
    }
    const lines = rawCookies.split("\n").filter((l) => l.trim() && !l.startsWith("#"));
    const domains = [...new Set(lines.map((l) => l.split("\t")[0]?.trim()).filter(Boolean))];
    const igLines = lines.filter((l) => l.includes("instagram.com"));
    const igCookieNames = igLines.map((l) => l.split("\t")[5]?.trim()).filter(Boolean);

    let testResult = null;
    if (req.query.test_url) {
      const testUrl = String(req.query.test_url);
      const withProxy = req.query.no_proxy !== "1";
      const noUserAgent = req.query.no_ua === "1";
      const args = ["--dump-json", "--no-warnings", testUrl];
      const t0 = Date.now();
      try {
        const out = await runYtDlp(args, 45000, null, { noProxy: !withProxy, noUserAgent });
        testResult = {
          success: true,
          ms: Date.now() - t0,
          stdoutLen: out.stdout.length,
          preview: out.stdout.slice(0, 300),
        };
      } catch (err) {
        testResult = {
          success: false,
          ms: Date.now() - t0,
          error: (err && err.message) || String(err),
        };
      }
    }

    // Inspect the exact instagram lines in cookies.txt (mask values)
    const igLinesMasked = igLines.map((l) => {
      const parts = l.split("\t");
      if (parts.length >= 7) {
        const val = parts[6];
        const masked = val.length > 8 ? `${val.slice(0, 4)}...${val.slice(-4)} (${val.length} chars)` : val;
        return `${parts[0]}\t${parts[5]}=${masked}`;
      }
      return l.slice(0, 50);
    });

    res.json({
      ok: true,
      cookiesPath: COOKIES_PATH,
      cookiesBytes: rawCookies.length,
      domains,
      igCookieNames,
      igLinesMasked,
      hasIgSession: igCookieNames.includes("sessionid"),
      hasProxy: Boolean(process.env.PROXY_URL),
      ytDlpVersion,
      testResult,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/debug-direct", async (req, res) => {
  const videoId = String(req.query.v || "ni78Ft1bXPU").trim();
  const logs = [];
  const activeCookieHeader = SERVER_COOKIE_HEADER;
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
      clientName: "WEB",
      clientVersion: "2.20241021.01.00",
      hl: "en",
      gl: "US",
      userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
      isMobile: false,
    },
  ];
  for (const client of clients) {
    try {
      const { userAgent, isMobile, ...clientPayload } = client;
      const resp = await innertubePost(
        {
          videoId,
          contentCheckOk: true,
          racyCheckOk: true,
          context: { client: clientPayload },
        },
        { "User-Agent": userAgent, ...(isMobile ? {} : { Cookie: activeCookieHeader, Authorization: getSapisidHash(activeCookieHeader), Origin: "https://www.youtube.com", Referer: "https://www.youtube.com/" }) },
      );
      const formats = [...(resp.data?.streamingData?.formats || []), ...(resp.data?.streamingData?.adaptiveFormats || [])];
      logs.push({
        client: client.clientName,
        status: resp.status,
        playability: resp.data?.playabilityStatus?.status,
        reason: resp.data?.playabilityStatus?.reason,
        formatsCount: formats.length,
        directUrls: formats.filter((f) => f.url).length,
        error: resp.error,
      });
    } catch (e) {
      logs.push({ client: client.clientName, exception: e.message });
    }
  }
  res.json({ logs, hasProxy: !!process.env.PROXY_URL, proxyDispatcher: !!proxyDispatcher, proxyInitError, rawProxyUrl: process.env.PROXY_URL ? process.env.PROXY_URL.replace(/:[^:@]+@/, ":***@") : null });
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
      "--geo-bypass-country",
      "IN",
      "--no-check-certificates",
      "--user-agent",
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
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
      const isIg = /instagram\.com|instagr\.am/i.test(key);
      const rawText = formatAsNetscapeCookies(cookies.trim(), isIg);
      if (rawText) {
        cookieHeader = netscapeToCookieHeader(rawText);
        tempCookiePath = path.join(TMPDIR, `cookies-${crypto.randomBytes(6).toString("hex")}.txt`);
        await fsp.writeFile(tempCookiePath, rawText, { mode: 0o600 });
        console.log(`[cookies] wrote ${rawText.length} bytes to ${tempCookiePath}`);
      }
    } catch (cookieErr) {
      console.error("[cookies] failed to write temp cookies:", cookieErr);
    }
  }

  // Visitor-cookie requests are never served from/written to the shared cache
  if (!tempCookiePath) {
    const cached = parseCache.get(key);
    const cachedVids = cached?.data?.resources?.filter((r) => !r.audioOnly) || [];
    if (cached && cached.expires > Date.now() && cachedVids.length > 1) {
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
    const ytDlpArgs = ["--dump-json", "--no-warnings"];
    if (!key.includes("/stories/")) {
      ytDlpArgs.push("--no-playlist");
    }
    ytDlpArgs.push(key);

    const { stdout } = await runYtDlpWithFallback(
      ytDlpArgs,
      60000,
      tempCookiePath,
      key,
    );

    let info = null;
    try {
      info = JSON.parse(stdout);
    } catch {
      const lines = stdout.trim().split("\n").filter(Boolean);
      const parsedLines = [];
      for (const l of lines) {
        try {
          parsedLines.push(JSON.parse(l));
        } catch {}
      }

      const storyIdMatch = key.match(/\/stories\/[^/]+\/(\d+)/);
      if (storyIdMatch) {
        const targetId = storyIdMatch[1];
        info = parsedLines.find((p) => p.id === targetId || String(p.id).includes(targetId));
      }

      if (!info && parsedLines.length > 1) {
        // Multi-item carousel!
        info = {
          title: parsedLines[0].title || "Instagram Post",
          thumbnail: parsedLines[0].thumbnail || parsedLines[0].url,
          uploader: parsedLines[0].uploader || null,
          entries: parsedLines,
        };
      } else if (!info && parsedLines.length === 1) {
        info = parsedLines[0];
      }
    }

    if (!info) {
      throw new Error("Could not parse media details from output.");
    }

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
    return res.json(data);
  } catch (e) {
    console.error("[yt-dlp info error]:", (e && e.message) || e);
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

    const hasIgSession = Boolean(
      tempCookiePath ||
      process.env.IG_SESSIONID ||
      process.env.IG_COOKIES ||
      (HAS_COOKIES && (() => {
        try {
          return fs.readFileSync(COOKIES_PATH, "utf8").includes("instagram.com");
        } catch {
          return false;
        }
      })())
    );

    const errText = String((e && e.message) || e);
    const isLoginRequired = /log in to access this content|login_required|sign in|only available to logged in users/i.test(errText);

    if (isLoginRequired) {
      return res.status(403).json({
        error: hasIgSession
          ? "This story is unavailable or may have expired."
          : "Instagram Stories require an active login session.",
        detail: hasIgSession
          ? "The story may have expired (stories expire after 24 hours), been deleted, or is from an account not accessible to this session."
          : "Meta restricts Instagram Stories to authenticated accounts.",
        needsCookies: !hasIgSession,
        isStory: true,
      });
    }

    const isInstagram = /instagram\.com|instagr\.am/i.test(key);
    res.status(502).json({
      error: isInstagram ? "Could not fetch Instagram media info." : "Could not fetch video info.",
      detail: errText.slice(0, 200),
      hint: hasIgSession
        ? undefined
        : isInstagram
        ? "Instagram blocks datacenter servers from accessing private posts and stories without login. Set IG_SESSIONID in Render."
        : "Try adding your cookies in 'Blocked? Use your own YouTube cookies' below.",
      needsCookies: isInstagram && isLoginRequired,
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
      const isIg = /instagram\.com|instagr\.am/i.test(key);
      const rawText = formatAsNetscapeCookies(cookies.trim(), isIg);
      if (rawText) {
        cookieHeader = netscapeToCookieHeader(rawText);
        tempCookiePath = path.join(TMPDIR, `cookies-${crypto.randomBytes(6).toString("hex")}.txt`);
        await fsp.writeFile(tempCookiePath, rawText, { mode: 0o600 });
      }
    } catch {}
  }

  // Direct stream fallback for Instagram
  if (format_id && (String(format_id).startsWith("ig_") || String(format_id).startsWith("slide_"))) {
    const isImg = String(format_id).includes("_img_") || String(format_id).startsWith("slide_img_");
    const cachedItem = parseCache.get(key)?.data?.resources?.find((r) => r.id === format_id);
    let directUrl = cachedItem?.directUrl || parseCache.get(key)?.data?.directUrl;
    let title = parseCache.get(key)?.data?.title || (isImg ? "instagram_photo" : "instagram_reel");
    if (!directUrl) {
      const ig = await fetchInstagramDirect(key);
      const resItem = ig?.resources?.find((r) => r.id === format_id);
      if (resItem?.directUrl || ig?.directUrl) {
        directUrl = resItem?.directUrl || ig.directUrl;
        title = ig.title || title;
      }
    }
    if (directUrl) {
      try {
        const streamRes = await fetch(directUrl);
        if (streamRes.ok) {
          const ext = isImg ? "jpg" : "mp4";
          const contentType = isImg ? "image/jpeg" : "video/mp4";
          const filename = `${sanitizeFilename(title)}.${ext}`;
          res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
          res.setHeader("Content-Type", contentType);
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

  const id = crypto.randomBytes(8).toString("hex");
  const outTmpl = path.join(TMPDIR, `tvdl-${id}.%(ext)s`);

  let args;
  if (audioOnly) {
    const af = ["mp3", "ogg", "opus", "wav", "m4a"].includes(String(audio_format))
      ? String(audio_format)
      : "mp3";
    args = ["-f", "ba/ba*/b/best", "-x", "--audio-format", af, "--audio-quality", "0"];
  } else if (format_id && /^[A-Za-z0-9_-]+$/.test(String(format_id))) {
    // Exact resource from /api/info; merge with best audio only when needed.
    const cleanId = String(format_id).replace(/^ye_/, "");
    const isMuxed = cleanId === "18" || cleanId === "22";
    args = isMuxed
      ? ["-f", cleanId]
      : [
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
    const dlExtra = key.includes("/stories/") ? [] : ["--no-playlist"];
    await runYtDlpWithFallback(
      [
        ...args,
        ...dlExtra,
        "--no-warnings",
        "--retries",
        "3",
        "--concurrent-fragments",
        "5",
        "--buffer-size",
        "1M",
        "--no-part",
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