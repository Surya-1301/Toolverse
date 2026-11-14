# Toolverse Download Backend (`yt-backend`)

The unified download backend for Toolverse media tools (YouTube, Instagram Reels, Music). Powered by Node.js, `yt-dlp`, and `ffmpeg`.

## Features
- **YouTube Downloader**: Multi-client extraction (`android`, `ios`, `web`) with support for authenticated visitor cookies.
- **Instagram Reels Downloader**: Extracts high-resolution MP4 video ladders (`960p`, `1280p`, `1920p`, `MP3`) with direct CDN fallback.
- **Music Downloader**: Audio extraction to high-quality MP3 (320kbps).
- **CORS Support**: Dynamic origin reflection for browser-based fetch calls.

## Deployment on Azure VM (with Automatic HTTPS)

Your VM has ports 80, 443, and 22 open. To deploy with automatic SSL using Caddy:

1. **Configure Azure DNS Name**:
   - In Azure Portal, open VM **Toolverse-Backend** > **Overview**.
   - Under **DNS name**, click **Not configured** (or Configure) and pick a prefix (e.g. `toolverse-backend`).
   - Your full domain will be: `<name>.<region>.cloudapp.azure.com`.

2. **SSH into the Azure VM and run**:
   ```bash
   git clone https://github.com/Surya-1301/Toolverse.git
   cd Toolverse/download-server
   bash deploy-azure.sh <your-domain.cloudapp.azure.com>
   ```

3. **Verify**:
   ```bash
   curl https://<your-domain.cloudapp.azure.com>/health
   ```

## Deployment on Render


1. Create a new **Web Service** on [Render.com](https://render.com).
2. Connect the `Toolverse` GitHub repository.
3. Configure the service settings:
   - **Environment**: `Docker`
   - **Dockerfile Path**: `Dockerfile.yt-backend` (or `download-server/Dockerfile.yt-backend`)
4. Set Environment Variables (optional):
   - `PORT`: `3000`
   - `CORS_ORIGIN`: `*` (or your frontend domains)
   - `MAX_MINUTES`: `10`
   - `COOKIES_B64`: (Optional) Base64-encoded `cookies.txt` for persistent server-side YouTube authentication.

## Local Docker Run

```bash
docker compose up -d
curl http://localhost:3000/
```
