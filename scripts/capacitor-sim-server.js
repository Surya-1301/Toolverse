#!/usr/bin/env node
/**
 * Mimics Capacitor's WebViewLocalServer route resolution so we can test
 * the APK behaviour locally.
 *
 * Capacitor (html5mode = true) serves:
 *   - "/"                              -> assets/public/index.html
 *   - any path WITHOUT a "." extension -> assets/public/index.html  (!!)
 *   - any path WITH a "." extension    -> the matching file on disk
 *
 * Usage: node scripts/capacitor-sim-server.js [port]
 */
const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = Number(process.argv[2]) || 8788;
const ROOT = path.resolve(__dirname, "..", "out");

const MIME = {
  ".html": "text/html",
  ".js": "application/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".webmanifest": "application/manifest+json",
  ".txt": "text/plain",
};

function resolve(urlPath) {
  // Capacitor: extension-less paths fall back to the ROOT index.html.
  const lastSegment = urlPath.split("/").filter(Boolean).pop() || "";
  if (urlPath === "/" || !lastSegment.includes(".")) {
    return path.join(ROOT, "index.html");
  }
  const direct = path.join(ROOT, urlPath);
  if (fs.existsSync(direct) && fs.statSync(direct).isFile()) {
    return direct;
  }
  return path.join(ROOT, urlPath, "index.html");
}

http
  .createServer((req, res) => {
    const urlPath = decodeURIComponent(req.url.split("?")[0]);
    const file = resolve(urlPath);
    console.log(req.method, req.url, "->", path.relative(ROOT, file));
    if (!fs.existsSync(file)) {
      res.writeHead(404, { "Content-Type": "text/plain" });
      res.end("Not found");
      return;
    }
    res.writeHead(200, {
      "Content-Type": MIME[path.extname(file)] || "application/octet-stream",
    });
    fs.createReadStream(file).pipe(res);
  })
  .listen(PORT, () => {
    console.log("Capacitor simulator on http://localhost:" + PORT);
  });
