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
