# Toolverse

[![GitHub release](https://img.shields.io/github/v/release/Surya-1301/Toolverse)](https://github.com/Surya-1301/Toolverse/releases)
[![Live site](https://img.shields.io/website?url=https%3A%2F%2Ftoolversee.pages.dev&label=live%20site)](https://toolversee.pages.dev)
[![Android app](https://img.shields.io/badge/Android-APK_download-3DDC84?logo=android&logoColor=white)](https://downloadtoolverse.dpdns.org/)
[![License](https://img.shields.io/github/license/Surya-1301/Toolverse)](LICENSE)

![Toolverse Home](public/home.png)

**Free online utilities — formatters, converters, generators, image tools, and sharing tools, right in your browser.**

No sign-up. Most tools run entirely on your device, so your input never leaves your computer.

<div align="center">

| 🌐 Live site | 📱 Android app |
|---|---|
| [toolversee.pages.dev](https://toolversee.pages.dev) | [downloadtoolverse.dpdns.org](https://downloadtoolverse.dpdns.org/) |

</div>

---

## Mobile apps (Android & iOS)
![Toolverse Download](public/app.png)

Toolverse is available as a native mobile app wrapped with Capacitor 8 — all 59+ tools with offline-first client processing and native system integrations.

📥 **Android APK Download:** https://downloadtoolverse.dpdns.org/

- **Apple Fluid Design**: Clean frosted glassmorphism interface with custom dark/light theme support, responsive floating overlays, and touch-optimized ergonomics.
- **Offline Capable**: Most formatters, converters, and generators run 100% locally on your device with zero data leaving your phone.
- **Native Integrations**: Capacitor plugins for native sharing, local notifications, file system access, and dynamic status bar styling.
- **Automated Builds**: APKs are built with Capacitor + GitHub Actions and attached to each release tag.

> The APK is debug-signed, so Android will show an "unknown developer" warning during sideloading. This is expected for apps installed outside the Play Store.

---

## Features

60+ tools across 6 categories. Every tool has its own dedicated page with live controls, step-by-step guidance, and FAQs.

### Media & Download Tools

<div align="center">

| Tool | What it does |
|---|---|
| YouTube Downloader | Download YouTube videos up to 4K & MP3 audio with multi-client extraction |
| Instagram Reels Downloader | Download Instagram Reels, videos, carousels, and photos in high resolution |
| Music Downloader | Extract high-bitrate audio streams directly to 320kbps MP3 |
| Audio Converter | Convert MP3, WAV, OGG, and M4A directly in the browser |

</div>

### Sharing & Hosting

<div align="center">

| Tool | What it does |
|---|---|
| Paste | Share text & code with a link, viewer included |
| URL Shortener | Short links with redirect tracking & expiry |
| Image Hosting | Host images with a direct link |
| File Sharing | Share files with a download link |
| Owner Dashboard | Manage your hosted files & images |
| Encrypted Uploads | Client-side encryption for shared uploads |

</div>

### Conversion Tools

<div align="center">

| Tool | What it does |
|---|---|
| Markdown to PDF | Convert Markdown documents to PDF |
| Markdown to HTML | Convert Markdown to HTML |
| YAML ↔ JSON | Convert between YAML and JSON |
| CSV ↔ JSON | Convert between CSV and JSON |
| Excel ↔ CSV | Convert between spreadsheets and CSV |
| Color Converter | Convert between RGB, HEX, and HSL |
| Regex Tester | Test regular expressions live |
| JSON ↔ XML | Convert between JSON and XML |
| Image to Base64 | Encode images as Base64 data URLs |

</div>

### Formatters

HTML Formatter · CSS Formatter · JavaScript Formatter · TypeScript Formatter · JSON Formatter · SQL Formatter

### Image Tools

<div align="center">

| Tool | What it does |
|---|---|
| Image Converter | Convert PNG, JPG, WebP, HEIC, HEIF |
| Image Compressor | Shrink images to a target file size |
| Image Resizer & Cropper | Resize and crop with live preview |
| Image Blur | Blur all or part of an image |
| Image Watermark | Add text watermarks to images |
| Background Remover | Remove image backgrounds (AI) |
| Favicon Generator | Generate favicons in every size |
| OG Image Generator | Generate Open Graph social images |
| Image Upscaler | Enlarge images |
| Image Placeholder | Generate placeholder images |
| Image Host | Host and share images |

</div>

### Text & Developer Tools

<div align="center">

| Tool | What it does |
|---|---|
| IP Lookup | Look up IP address details |
| Credit Card Generator & Validator | Generate test cards, validate with Luhn |
| Fake Address & User Generator | Realistic fake data in 16 locales |
| UUID Generator | Generate UUIDs in bulk |
| Password Generator | Secure passwords with strength analysis |
| Password Strength Checker | Score any password |
| Hash Generator | MD5, SHA-1, SHA-256, and more |
| Random String Generator | Random strings with custom alphabets |
| Base64 Encoder / Decoder | Encode & decode Base64 |
| JWT Decoder | Decode JWT headers & payloads |
| Lorem Ipsum Generator | Placeholder text in any length |
| Text Counter | Words, characters, sentences, reading time |
| Case Converter | UPPER, lower, Title, camel, snake, kebab |
| Duplicate Line Remover | Deduplicate lines in any text |
| Timestamp Converter | Unix ↔ human-readable dates |
| URL Tools | Encode, decode, parse URLs |
| Text to Speech | Read text aloud in the browser |
| Audio Converter | Convert audio formats in the browser |
| Domain Lookup | WHOIS & DNS records for any domain |
| HTTP Request Tester | Test API endpoints from the browser |
| Text Compare & Diff | Side-by-side text diff |
| Email, Phone & IBAN Validator | Validate emails, phones, IBANs |
| QR Generator | Generate QR codes for any text or URL |

</div>

### PDF Tools

The standalone PDF editor now lives on [PDFVerse](https://pdfverse.pages.dev/) — a dedicated
site with merging, splitting, extraction, conversion, compression, forms, OCR, and security
tools. On Toolverse, `/pdf-editor` and `/pdf-to-markdown` simply redirect there.

PDF compression itself remains available on Toolverse via the
[Image & PDF Compressor](/image-compressor), and Markdown to PDF stays in the
Conversion Tools category.

---

## Screenshots

![Toolverse Scr-1](public/Scr-1.png)
![Toolverse Scr-2](public/Scr-2.png)
![Toolverse Scr-3](public/Scr-3.png)

---

## How it works

**Browser-first architecture.** The vast majority of tools run 100% client-side — formatters, converters, generators, and image tools never upload your input.

**Cloudflare Worker API.** Sharing tools (paste, URL shortener, image/file hosting) run on the Toolverse API — Cloudflare Workers with D1 metadata and R2 file storage.

**Download backend.** Media downloaders (YouTube 4K/1080p, Instagram Reels, MP3 audio) are handled by a dedicated Node.js + `yt-dlp` + `ffmpeg` microservice running in Docker on an Azure Linux VM, terminated with automated Let's Encrypt HTTPS via Caddy.

**Image backend.** Background removal and PDF compression run on the Toolverse image API (FastAPI + remove.bg + Ghostscript).

**Chrome Extension.** A Manifest V3 companion extension injects download controls directly into video platforms and connects to Toolverse for rapid media conversion.

**PDF editor.** The standalone PDF editor lives on [PDFVerse](https://pdfverse.pages.dev/); the Toolverse `/pdf-editor` and `/pdf-to-markdown` routes redirect there.

---

## Tech Stack

### Frontend & Mobile

- **Next.js 16** (App Router) + **React 19**
- **TypeScript** · **Tailwind CSS 4**
- **Capacitor 8** (`@capacitor/core`, `@capacitor/android`, `@capacitor/ios`)
- Native Capacitor plugins: `@capacitor/app`, `@capacitor/filesystem`, `@capacitor/local-notifications`, `@capacitor/share`, `@capacitor/status-bar`
- **Apple Fluid Design System**: Ultra-frosted glassmorphic cards (`.apple-glass`), specular light accents (`.apple-specular`), midnight dark mode (`#070a14`), and adaptive responsive popovers
- `pdf-lib` — client-side PDF generation
- `browser-image-compression`, `heic2any` — image workflows
- `qrcode`, `xlsx`, `lamejs`, `bcryptjs`, `lucide-react`

### Download Backend (`download-server/`)

Deployed in Docker on an Azure Linux VM with Caddy reverse proxy:

- **Node.js 20 + Express** — API orchestration & format stream muxing
- **yt-dlp** — Multi-client video extraction (Android, iOS, Web client fallback)
- **ffmpeg** — Audio/video stream muxing & 320kbps MP3 conversion
- **Caddy 2** — Automatic Let's Encrypt TLS/SSL termination (`toolverse-backend.centralindia.cloudapp.azure.com`)
- **Docker Compose** — Container orchestration with volume hot-reloading

### Browser Extension (`extension/`)

- **Manifest V3** Chrome & Edge extension
- **In-page injected controls** for YouTube video player
- **Auto video detection** & quick download popup

### Cloudflare API Worker (`backend/`)

- **Cloudflare Workers + Wrangler**
- **Cloudflare D1** — metadata
- **Cloudflare R2** — uploaded files & images

Bindings in `backend/wrangler.jsonc`: `DB` (D1), `FILES_BUCKET` (R2).

### Image Backend (`image-backend/`)

Deployed separately on Render (Docker).

- **Python + FastAPI + Uvicorn** — API
- **Pillow**, `python-multipart`, `requests` — image handling & remove.bg
- **Ghostscript** — PDF compression

---

## Project Structure

```txt
Toolverse/
├─ app/                          # Next.js App Router pages & tool routes
│  ├─ tools/                     # Tool index & category directory
│  ├─ youtube-downloader/        # YouTube video/audio downloader UI
│  ├─ instagram-reels-downloader/# Instagram Reels & media downloader UI
│  ├─ music-downloader/          # Music & high-bitrate MP3 extractor
│  ├─ paste/, paste-view/        # Paste creation & viewing
│  ├─ file/, file-share/         # File management & sharing
│  ├─ image-*/                   # Image processing tools
│  └─ *-formatter/               # Code & data formatters
├─ components/                   # Shared React components & UI primitives
├─ lib/                          # Shared helpers, apiBase, seoTools
├─ download-server/              # Media download backend (Node.js + yt-dlp + Caddy)
├─ extension/                    # Manifest V3 Chrome Extension
├─ backend/                      # Cloudflare Worker API + D1 migrations
├─ backend-routes/               # Next.js proxy routes for backend APIs
├─ image-backend/                # Python image-processing service
├─ public/                       # Static assets, icons, sitemap, robots, redirects
├─ resources/android-icons/       # Android launcher icons (Capacitor)
├─ capacitor.config.ts           # Capacitor mobile app config
├─ .github/workflows/android.yml # GitHub Actions Android APK build
├─ wrangler.jsonc                # OpenNext / Cloudflare frontend config
└─ package.json
```

---

## Getting Started

### Prerequisites

- Node.js 22+ and npm

### 1. Clone the repository

```bash
git clone https://github.com/Surya-1301/Toolverse.git
cd Toolverse
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment

Create a `.env.local` file in the project root:

```env
NEXT_PUBLIC_API_BASE_URL=....
NEXT_PUBLIC_IMAGE_API_BASE_URL=....

> For local backend development, point these at your local servers (Worker `http://localhost:8787`, image `http://localhost:8000`).

### 4. Run the dev server

```bash
npm run dev
```

Open http://localhost:3000

---

## Environment Variables

<div align="center">

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_API_BASE_URL` | Yes | Base URL of the Cloudflare Worker API (sharing tools) |
| `NEXT_PUBLIC_IMAGE_API_BASE_URL` | Yes | Base URL of the image backend (background remover, PDF compression) |
| `NEXT_PUBLIC_YT_BACKEND` | Yes | Base URL of the media download backend (e.g. `https://toolverse-backend.centralindia.cloudapp.azure.com`) |

</div>

> Keep local environment files out of version control. The repository ignores `.env*` and `*cookies.txt` files.

---

## Available Scripts

<div align="center">

| Command | Description |
|---|---|
| `npm run dev` | Start the dev server |
| `npm run build` | Production build (static export) |
| `npm run start` | Start the production server |
| `npm run lint` | Run ESLint |
| `npm run build:cloudflare` | Build with OpenNext for Cloudflare |
| `npm run preview:cloudflare` | Preview the Cloudflare build |
| `npm run deploy:cloudflare` | Build & deploy to Cloudflare Pages |
| `npm run build:mobile` | Export web build and sync to Capacitor Android & iOS |
| `npm run build:android` | Export web build and sync to Capacitor Android |
| `npm run build:ios` | Export web build and sync to Capacitor iOS |
| `npm run apk` | Build and compile debug Android APK locally |
| `npm run ios` | Build and open iOS project in Xcode |

</div>

---

## Deployment

### Frontend — Cloudflare Pages

- **Build command:** `npm run build:cloudflare`
- **Config:** `wrangler.jsonc`, `open-next.config.ts`, `next.config.ts` (`output: "export"`, `trailingSlash: true`)
- **Environment variables:** `NEXT_PUBLIC_API_BASE_URL`, `NEXT_PUBLIC_IMAGE_API_BASE_URL`, `NEXT_PUBLIC_YT_BACKEND`

Or deploy via CLI: `npm run deploy:cloudflare` (requires `wrangler` login).

### Download Backend — Azure Linux VM (Docker + Caddy)

Runs on an Azure Linux VM with Caddy reverse proxy for automated Let's Encrypt HTTPS:

```bash
cd download-server
bash deploy-azure.sh toolverse-backend.centralindia.cloudapp.azure.com
```

- **Health check:** `https://toolverse-backend.centralindia.cloudapp.azure.com/health`
- **Compose stack:** `docker-compose.azure.yml` mounts live `server.js` and local `cookies.txt`.

### Cloudflare API — Workers

Deploy from `backend/`:

```bash
cd backend
npm install
npm run deploy
```

Run the remote D1 schema migration with:

```bash
npm run db:migrate
```

### Image Backend — Render

- **Service type:** Web Service
- **Environment:** Docker
- **Root directory:** `image-backend`
- **Dockerfile path:** `./Dockerfile`
- **Environment variable:** `REMOVEBG_API_KEY`

### Chrome Extension (`extension/`)

- Open `chrome://extensions/` in Chrome.
- Enable **Developer mode** (top-right).
- Click **Load unpacked** and select the `Toolverse/extension` folder.
- Injects quick-download buttons on `youtube.com` and provides instant media extraction via popup.

### Android App — GitHub Actions

The APK is built in the cloud on tag push — no Android Studio needed.

```bash
git tag -a v0.1.0 -m "v0.1.0"
git push origin v0.1.0
```

The workflow (`.github/workflows/android.yml`) builds the web app, adds the Android platform with Capacitor, and attaches the APK to the GitHub release. Manual runs: **Actions → Android APK → Run workflow**.

---

## Backend API Overview

### Download Backend (`download-server/`)

Base URL: `NEXT_PUBLIC_YT_BACKEND`

<div align="center">

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` | Health & cookie status check |
| `POST` | `/api/info` | Extract video/audio details, resolutions, thumbnails |
| `GET` | `/api/download` | Stream muxed MP4/MP3 media attachment with range requests |
| `GET` | `/api/stream` | Stream direct video playback |

</div>

### Cloudflare Worker API

Base URL: `NEXT_PUBLIC_API_BASE_URL`

<div align="center">

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/paste/create` | Create a paste |
| `GET` | `/api/paste/:id` | View a paste |
| `PUT` | `/api/paste/:id` | Update a paste |
| `POST` | `/api/shorten` | Shorten a URL |
| `GET` | `/s/:slug` | Redirect a short link |
| `POST` | `/api/image/upload` | Upload an image |
| `GET` | `/api/image/:id/direct` | Direct image link |
| `POST` | `/api/file/upload` | Upload a file |
| `GET` | `/api/file/:id/download` | Download a shared file |

</div>

### Image Backend

Base URL: `NEXT_PUBLIC_IMAGE_API_BASE_URL`

<div align="center">

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` | Health check |
| `POST` | `/api/image/remove-background` | Remove image background |
| `POST` | `/api/pdf/compress` | Compress a PDF (Ghostscript, quality tiers `0.01`–`0.85`) |

</div>

---

## Privacy & File Handling

- **Browser tools:** files never leave the user's device. No upload, no tracking of file contents.
- **Sharing tools:** pastes, images, and files are uploaded to the Cloudflare API (D1 + R2) so they can be shared via link.
- **Server processing:** background removal, media extraction, and PDF compression are processed securely over HTTPS; temporary artifacts are deleted immediately after download.
- Full details: https://toolversee.pages.dev/privacy
- Report abuse: https://toolversee.pages.dev/report-abuse

---

## SEO & Indexing

- **Self-referencing Canonical URLs:** Every tool and category page outputs an explicit canonical link (`https://toolversee.pages.dev/[slug]/`) matching the Next.js `trailingSlash: true` specification.
- **Structured Data:** Automated `FAQPage` and `BreadcrumbList` Schema.org JSON-LD dynamically injected into every tool page via `lib/seoTools.ts` and `components/SeoFaq.tsx`.
- **Sitemap & Robots:** Clean static `public/sitemap.xml` and `public/robots.txt` referencing all public tools, blog articles, and categories.
- **Clean 301 Redirects:** Legacy or merged URLs are routed cleanly via `public/_redirects` to avoid redirect chains.

---

## License

MIT — see [LICENSE](LICENSE).

---

