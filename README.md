# ToolverseX

ToolverseX is a collection of free online tools for developers, creators, and everyday users.

## Current tools

- JSON Formatter
- QR Generator
- Image Compressor
- Paste
- URL Shortener

## Development storage note

The Paste and URL Shortener tools currently use local JSON files in the `data/` folder for development.

This is not production-safe for serverless hosting because local file writes may not persist.

Before public production launch, move storage to one of:

- Cloudflare D1
- Supabase
- PostgreSQL
- Upstash Redis

## Run locally

## Production storage note

This project currently uses local JSON files and local upload folders for development:

- `data/*.json`
- `uploads/images`
- `uploads/files`

This is not production-safe on serverless hosting such as Vercel because local file writes and uploads may not persist.

Before public launch, move storage to:

- Cloudflare D1 for metadata
- Cloudflare R2 for uploaded images/files

Alternative:

- Supabase Database + Supabase Storage
