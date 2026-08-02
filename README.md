# Toolverse

ToolverseX is a privacy-friendly collection of free online utilities for developers, creators, and everyday users. It includes browser-first tools, shareable links, Cloudflare-backed uploads, and a dedicated PDF backend for heavier PDF conversion and security workflows.

## Live services

- Frontend: `https://toolversee.pages.dev`
- Cloudflare Worker API: `https://toolversex-api.jethalalmirror.workers.dev`
- PDF backend: `https://toolverse-pdf-api.onrender.com`
- PDF backend health check: `https://toolverse-pdf-api.onrender.com/health`

## Features

### General tools

- JSON Formatter
- QR Generator
- Image Compressor
- Paste sharing
- URL Shortener
- Image Host
- Upload & Share for images, PDFs, and general files
- OCR PDF
- PDF to Markdown

### PDF Editor

The PDF Editor groups tools into Organize, Convert to PDF, Convert from PDF, Edit PDF, and PDF Security.

#### Organize PDF

- Merge PDF
- Split PDF
- Remove pages
- Extract pages
- Organize / reorder PDF pages
- Scan to PDF

#### Convert to PDF

- JPG / PNG / WebP to PDF
- Word to PDF
- PowerPoint to PDF
- Excel to PDF
- HTML to PDF

#### Convert from PDF

- PDF to JPG
- PDF to Word
- PDF to PowerPoint
- PDF to Excel
- PDF to PDF/A

#### Edit PDF

- Rotate PDF
- Add page numbers
- Add text watermark
- Add image watermark
- Crop PDF
- Fill PDF forms
- Compress PDF

#### PDF Security

- Unlock PDF
- Protect PDF
- Redact PDF
- Compare PDF

## Tech stack

### Frontend

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS
- `pdf-lib` for browser-side PDF editing
- `qrcode` for QR generation
- `browser-image-compression` for image compression
- `lucide-react` icons

### Cloudflare Worker API

The Worker API handles persistent share/link functionality using Cloudflare infrastructure.

- Cloudflare Workers
- Cloudflare D1 database
- Cloudflare R2 bucket
- Wrangler

Worker bindings:

- `DB` → D1 database metadata store
- `FILES_BUCKET` → R2 file/image storage

### PDF backend

Heavy PDF operations run in a separate Node/Express backend, intended for Render or Docker deployment.

- Node.js + Express
- Multer uploads
- Ghostscript for compression and PDF/A
- LibreOffice for Office → PDF
- Chromium for HTML → PDF
- Poppler `pdftoppm` for PDF → JPG
- Python packages:
  - PyMuPDF
  - pdf2docx
  - python-pptx
  - openpyxl
  - Pillow
  - pikepdf

## Project structure

```txt
app/                         Next.js app routes
  page.tsx                   Home page
  tools/page.tsx             All tools page
  pdf-editor/page.tsx        Main PDF editor UI
  json-formatter/            JSON Formatter
  qr-generator/              QR Generator
  image-compressor/          Image Compressor
  paste/                     Paste creator
  paste-view/                Paste viewer
  url-shortener/             URL Shortener
  file-share/                Upload & Share
  image-host/                Image Host
  ocr-pdf/                   OCR PDF tool
  pdf-to-markdown/           PDF to Markdown tool

components/                  Shared UI components
lib/                         Shared frontend helpers
public/                      Static assets, manifest, sitemap

backend/                     Cloudflare Worker API
  src/worker.ts              Worker routes
  schema.sql                 D1 database schema
  wrangler.jsonc             Worker config

pdf-backend/                 Express PDF backend
  server.js                  PDF API routes
  Dockerfile                 Render/Docker runtime
```

## Environment variables

Set these in local development and Cloudflare Pages production.

```env
NEXT_PUBLIC_API_BASE_URL=https://toolversex-api.jethalalmirror.workers.dev
NEXT_PUBLIC_PDF_API_BASE_URL=https://toolverse-pdf-api.onrender.com
```

For local development, use local service URLs if needed:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8787
NEXT_PUBLIC_PDF_API_BASE_URL=http://localhost:4000
```

## Local development

### 1. Install frontend dependencies

```bash
npm install
```

### 2. Run the Next.js frontend

```bash
npm run dev
```

Open:

```txt
http://localhost:3000
```

### 3. Run the Cloudflare Worker API locally

```bash
cd backend
npm install
npm run dev
```

### 4. Run the PDF backend locally

```bash
cd pdf-backend
npm install
npm run dev
```

The PDF backend runs on:

```txt
http://localhost:4000
```

Health check:

```bash
curl -i http://localhost:4000/health
```

## Deployment

### Cloudflare Worker API

Deploy the Worker from the `backend` folder:

```bash
cd backend
npx wrangler deploy
```

Verify:

```bash
curl -i https://toolversex-api.jethalalmirror.workers.dev
```

Expected response:

```json
{"name":"ToolverseX API","status":"ok"}
```

### Cloudflare Pages frontend

Build and deploy the frontend:

```bash
npm run build
npx wrangler pages deploy out --project-name toolversee
```

If using Git-based Cloudflare Pages deployments with manual watch paths, trigger a Pages deployment with:

```bash
date > .manual-deploy-only/deploy.txt
git add .manual-deploy-only/deploy.txt
git commit -m "Trigger frontend deploy"
git push origin main
```

### Render PDF backend

The PDF backend can be deployed on Render using the Dockerfile in `pdf-backend/`.

Recommended Render settings:

- Environment: Docker
- Root directory: `pdf-backend`
- Health check path: `/health`

Health endpoint:

```txt
https://toolverse-pdf-api.onrender.com/health
```

Example response:

```json
{
  "status": "ok"
}
```

## Manual deployment control

This project can use manual deployment marker paths to prevent every commit from deploying automatically.

### Cloudflare Pages manual marker

Cloudflare Pages build watch path:

```txt
.manual-deploy-only/**
```

Trigger Pages deploy:

```bash
date > .manual-deploy-only/deploy.txt
git add .manual-deploy-only/deploy.txt
git commit -m "Trigger frontend deploy"
git push origin main
```

### Cloudflare Worker manual marker

Worker build watch path:

```txt
.manual-worker-deploy-only/**
```

Trigger Worker deploy through Git integration:

```bash
date > .manual-worker-deploy-only/deploy.txt
git add .manual-worker-deploy-only/deploy.txt
git commit -m "Trigger Worker deploy"
git push origin main
```

Alternatively deploy the Worker directly:

```bash
cd backend
npx wrangler deploy
```

## API overview

### Cloudflare Worker API

Used by Paste, URL Shortener, Image Host, and Upload & Share.

Common routes include:

- `POST /api/paste/create`
- `GET /api/paste/:id`
- `PUT /api/paste/:id`
- `POST /api/shorten`
- `GET /api/shorten/:slug`
- `GET /s/:slug`
- `POST /api/image/upload`
- `GET /api/image/:id/meta`
- `GET /api/image/:id/direct`
- `POST /api/file/upload`
- `GET /api/file/:id/meta`
- `GET /api/file/:id/download`

### PDF backend API

Used by PDF Editor and PDF conversion tools.

- `GET /health`
- `POST /api/pdf/compress`
- `POST /api/pdf/office-to-pdf`
- `POST /api/pdf/html-to-pdf`
- `POST /api/pdf/to-jpg`
- `POST /api/pdf/to-word`
- `POST /api/pdf/to-excel`
- `POST /api/pdf/to-powerpoint`
- `POST /api/pdf/to-pdfa`
- `POST /api/pdf/unlock`
- `POST /api/pdf/protect`
- `POST /api/pdf/redact`
- `POST /api/pdf/compare`

## Monitoring

Use UptimeRobot, Better Stack, or another uptime monitoring service to check the PDF backend health endpoint every 5 minutes:

```txt
https://toolverse-pdf-api.onrender.com/health
```

Recommended monitor settings:

- Type: HTTP(s)
- Interval: 5 minutes
- Expected status: `200 OK`

## Notes and limitations

- Browser-first tools process files locally where possible.
- Heavy PDF tasks use the Render PDF backend.
- PDF to Excel conversion attempts to preserve table structure, but exact visual parity is not always possible because PDFs are position-based and Excel is cell-based.
- For an exact visual PDF representation in Excel, pages would need to be embedded as images, which would not be editable spreadsheet data.
- Upload and share data is stored with Cloudflare D1 metadata and Cloudflare R2 files.

## Useful commands

```bash
# Frontend
npm run dev
npm run build
npm run lint

# Cloudflare Worker
cd backend
npm run dev
npx wrangler deploy

# PDF backend
cd pdf-backend
npm run dev

# Git commit all changes
git status
git add .
git commit -m "Update ToolverseX"
git push origin main
```
