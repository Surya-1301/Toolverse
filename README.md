# Toolverse

Toolverse is a privacy-friendly collection of browser-first utilities for developers, creators, and everyday users. It includes formatters, converters, generators, image tools, PDF workflows, sharing tools, and developer utilities.

## Live Services

- Frontend: `https://toolversee.pages.dev`
- Cloudflare API: `https://toolversex-api.jethalalmirror.workers.dev`
- PDF backend: `https://toolverse-pdf-api-i6av.onrender.com`
- PDF health check: `https://toolverse-pdf-api-i6av.onrender.com/health`

## Features

### Sharing and Hosting

- Paste and paste viewer for text and code
- URL shortener with redirect tracking and expiry support
- Image hosting
- File sharing and shared-file viewers
- Owner dashboard for hosted files and images
- Client-side encryption support for shared uploads

### Conversion Tools

- Markdown to PDF
- Markdown to HTML
- YAML to JSON and JSON to YAML
- CSV to JSON and JSON to CSV
- Excel to CSV and CSV to Excel
- RGB, HEX, and HSL color conversion
- Regex tester
- JSON to XML and XML to JSON
- Image to Base64 conversion

### Formatter Tools

- HTML, CSS, JavaScript, TypeScript, JSON, and SQL formatters

### Image Tools

- Image converter
- Image compressor
- Image resizer and cropper
- Image blur
- Image watermark tool
- Background remover
- Favicon generator
- OG image generator
- Image upscaler
- Image placeholder
- Image host

### Text and Developer Tools

- IP address lookup
- Credit card generator and validator
- Fake address and user generator with 16 locales
- UUID generator
- Password generator with integrated strength analysis
- Hash generator
- Random string generator
- Base64 encoder and decoder
- JWT decoder
- Lorem Ipsum generator
- Text counter
- Case converter
- Duplicate line remover
- Timestamp converter
- URL tools
- Text to speech
- Audio converter
- Domain lookup with WHOIS and DNS support
- HTTP request/API tester
- Text compare and diff
- Email, phone, and IBAN validator
- QR generator

### PDF Tools

The PDF workspace includes a browser-based PDF editor and dedicated routes for:

- Merging, splitting, removing, extracting, and reordering pages
- Adding pages, text, page numbers, and watermarks
- Cropping, repairing, compressing, and editing metadata
- Filling and signing PDF forms
- Converting Office files, HTML, images, and PDFs
- Extracting PDF text and images
- Unlocking, protecting, redacting, and comparing PDFs
- Converting PDFs to Markdown

## Technology Stack

### Frontend

- Next.js 16 and React 19
- TypeScript
- Tailwind CSS 4
- `lucide-react` icons
- `pdf-lib` and `pdfjs-dist` for PDF editing and rendering
- `qrcode` for QR generation
- `browser-image-compression` and `heic2any` for image workflows
- `lamejs` for browser-side MP3 encoding
- `xlsx` for spreadsheet conversion
- `@dnd-kit` for drag-and-drop interactions
- `bcryptjs` for client-side hashing workflows
- `sharp` for supported image processing workflows

### Cloudflare API Worker

The Worker in `backend/` provides persistent sharing and storage APIs.

- Cloudflare Workers and Wrangler
- Cloudflare D1 for metadata
- Cloudflare R2 for uploaded files and images

Bindings configured in `backend/wrangler.jsonc`:

- `DB` for the D1 database
- `FILES_BUCKET` for the R2 bucket

### Image Backend

The `image-backend/` service is a small Python HTTP service used by image-processing tools.

- FastAPI
- Uvicorn
- Pillow
- `python-multipart`
- Requests

### PDF Backend

The `pdf-backend/` service is a Node.js and Express backend for heavier PDF operations and is suitable for Docker or Render deployment.

- Node.js
- Express
- Multer
- CORS support
- Docker deployment via `pdf-backend/Dockerfile`

## Project Structure

```text
app/                         Next.js App Router pages and tool routes
  tools/                     Tool index and category pages
  pdf/                       PDF utility routes
  pdf-editor/                Browser-based PDF editor
  paste/, paste-view/        Paste creation and viewing
  file/, file-share/         File management and sharing
  image-*/                   Image tools
  *-formatter/               Code and data formatters

components/                  Shared React components
lib/                         Shared frontend helpers and data generators
backend/                     Cloudflare Worker API and D1 migrations
backend-routes/              Next.js proxy routes for backend APIs
image-backend/               Python image-processing service
pdf-backend/                 Express PDF service
public/                      Static assets, icons, sitemap, and robots files
schema.sql                   Root database schema
wrangler.jsonc               OpenNext/Cloudflare frontend configuration
```

## Environment Variables

The frontend resolves API endpoints from environment variables or the configured production defaults in `lib/apiBase.ts`.

```env
NEXT_PUBLIC_API_BASE_URL=https://toolversex-api.jethalalmirror.workers.dev
NEXT_PUBLIC_PDF_API_BASE_URL=https://toolverse-pdf-api-i6av.onrender.com
NEXT_PUBLIC_IMAGE_API_BASE_URL=https://your-image-service.example.com
```

For local services:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8787
NEXT_PUBLIC_PDF_API_BASE_URL=http://localhost:4000
NEXT_PUBLIC_IMAGE_API_BASE_URL=http://localhost:8000
```

Keep local environment files out of version control. The repository ignores `env.local` and `.env*` files.

## Local Development

### Frontend

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

Useful frontend commands:

```bash
npm run lint
npm run build
npm run build:cloudflare
npm run preview:cloudflare
```

### Cloudflare API Worker

```bash
cd backend
npm install
npm run dev
```

The Worker normally runs at `http://localhost:8787`.

Deploy it with:

```bash
npm run deploy
```

Run the remote D1 schema migration with:

```bash
npm run db:migrate
```

### Image Backend

```bash
cd image-backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### PDF Backend

```bash
cd pdf-backend
npm install
npm run dev
```

The PDF backend normally runs at `http://localhost:4000`.

Health check:

```bash
curl -i http://localhost:4000/health
```

## Deployment

### Cloudflare Frontend

Build and deploy with OpenNext:

```bash
npm run build:cloudflare
npm run deploy:cloudflare
```

The frontend configuration is in `wrangler.jsonc` and `open-next.config.ts`.

### Cloudflare API

Deploy from `backend/`:

```bash
cd backend
npm run deploy
```

The Worker configuration and bindings are in `backend/wrangler.jsonc`.

### PDF Backend

Deploy `pdf-backend/` using its Dockerfile. The production health endpoint is:

```text
https://toolverse-pdf-api-i6av.onrender.com/health
```

## API Overview

The Cloudflare Worker API supports paste, shortening, image, and file workflows. Representative endpoints include:

```text
POST /api/paste/create
GET  /api/paste/:id
PUT  /api/paste/:id
POST /api/shorten
GET  /api/shorten/:slug
GET  /s/:slug
POST /api/image/upload
GET  /api/image/:id/meta
GET  /api/image/:id/direct
POST /api/file/upload
GET  /api/file/:id/meta
GET  /api/file/:id/download
```

The PDF backend exposes a health endpoint plus PDF conversion, editing, security, and comparison routes under `/api/pdf/*`.

## Notes

- Many tools process input entirely in the browser.
- Uploaded files and shared resources use the Cloudflare API and storage services.
- Heavy PDF processing runs through the separate PDF backend.
- PDF-to-spreadsheet conversion cannot always preserve exact visual layout because PDF pages are position-based while spreadsheets are cell-based.
- Generated build output such as `.next/`, `out/`, and `.open-next/` is ignored and can be recreated from the source tree.
