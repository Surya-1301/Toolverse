#!/usr/bin/env node
/**
 * Syncs the Next.js build output (out/) into the Capacitor iOS
 * public directory (ios/App/App/public/).
 * Run: node scripts/build-ios.js
 */
const fs = require("fs");
const path = require("path");

const SOURCE = path.resolve(__dirname, "..", "out");
const DEST = path.resolve(
  __dirname,
  "..",
  "ios",
  "App",
  "App",
  "public",
);

function copy(src, dst) {
  if (fs.statSync(src).isDirectory()) {
    fs.mkdirSync(dst, { recursive: true });
    for (const entry of fs.readdirSync(src)) {
      copy(path.join(src, entry), path.join(dst, entry));
    }
    return;
  }
  fs.mkdirSync(path.dirname(dst), { recursive: true });
  fs.writeFileSync(dst, fs.readFileSync(src));
}

if (!fs.existsSync(SOURCE)) {
  console.error(
    "Error: " + SOURCE + " does not exist. Run 'npm run build' first.",
  );
  process.exit(1);
}

// Start from a clean destination so stale or zero-byte files cannot persist.
if (fs.existsSync(DEST)) {
  fs.rmSync(DEST, { recursive: true, force: true });
}

copy(SOURCE, DEST);
console.log("Synced " + SOURCE + " -> " + DEST);

