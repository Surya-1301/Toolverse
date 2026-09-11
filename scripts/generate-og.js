#!/usr/bin/env node
/**
 * Generates public/og.png (1200x630) for social sharing previews.
 * Run: node scripts/generate-og.js
 */
const sharp = require("sharp");

const W = 1200;
const H = 630;

const svg = `
<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="bg" cx="30%" cy="20%" r="90%">
      <stop offset="0%" stop-color="#8b5cf6" />
      <stop offset="55%" stop-color="#7c3aed" />
      <stop offset="100%" stop-color="#4c1d95" />
    </radialGradient>
    <linearGradient id="accent" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#a78bfa" />
      <stop offset="100%" stop-color="#f0abfc" />
    </linearGradient>
  </defs>

  <!-- Background -->
  <rect width="${W}" height="${H}" fill="url(#bg)" />

  <!-- Decorative grid lines (subtle) -->
  <g stroke="rgba(255,255,255,0.06)" stroke-width="1">
    ${Array.from({ length: 12 }, (_, i) => `<line x1="${i * 100}" y1="0" x2="${i * 100}" y2="${H}" />`).join("")}
    ${Array.from({ length: 7 }, (_, i) => `<line x1="0" y1="${i * 90}" x2="${W}" y2="${i * 90}" />`).join("")}
  </g>

  <!-- Glow orb -->
  <circle cx="950" cy="120" r="260" fill="rgba(255,255,255,0.08)" />

  <!-- Logo tile -->
  <rect x="80" y="70" width="110" height="110" rx="24" fill="rgba(255,255,255,0.14)" stroke="rgba(255,255,255,0.35)" stroke-width="2"/>
  <rect x="104" y="94" width="62" height="62" rx="12" fill="url(#accent)" />
  <path d="M120 150 L120 120 L134 132 L148 112 L148 150 Z" fill="#0f172a" />

  <!-- Headline -->
  <text x="80" y="300" font-family="system-ui, -apple-system, sans-serif" font-size="76" font-weight="800" fill="#ffffff">Toolverse</text>

  <rect x="84" y="330" width="420" height="6" rx="3" fill="url(#accent)" />

  <!-- Subtitle -->
  <text x="80" y="392" font-family="system-ui, -apple-system, sans-serif" font-size="34" font-weight="500" fill="#e9d5ff">All-in-one online utility tools</text>
  <text x="80" y="440" font-family="system-ui, -apple-system, sans-serif" font-size="26" font-weight="400" fill="rgba(233,213,255,0.85)">JSON · QR · Images · PDF · Paste · Shorten · Share</text>

  <!-- Feature chips -->
  ${["Free forever", "No signup", "Browser-first"].map((label, i) => {
    const x = 80 + i * 260;
    return `<g>
      <rect x="${x}" y="500" width="230" height="54" rx="27" fill="rgba(255,255,255,0.10)" stroke="rgba(255,255,255,0.25)" />
      <text x="${x + 115}" y="535" font-family="system-ui, -apple-system, sans-serif" font-size="22" font-weight="600" fill="#ffffff" text-anchor="middle">${label}</text>
    </g>`;
  }).join("")}

  <!-- URL -->
  <text x="W" y="0" font-family="system-ui, -apple-system, sans-serif" font-size="26" font-weight="600" fill="rgba(255,255,255,0.7)"></text>
</svg>
`;

(async () => {
  await sharp(Buffer.from(svg))
    .png()
    .toFile("public/og.png");
  console.log("Generated public/og.png (1200x630)");
})();