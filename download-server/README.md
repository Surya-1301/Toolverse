# Toolverse Download Server

Your own self-hosted download infrastructure: a [cobalt](https://github.com/imputnet/cobalt)
API instance (Instagram, TikTok, SoundCloud, …) **plus** a dedicated
yt-dlp backend just for YouTube.

> **Why two backends?** YouTube aggressively rate-limits datacenter IPs, so it
> gets its own dedicated backend. Verified working Oct 2026: plain yt-dlp
> (no cookies) fetched 37 video formats (144p–2160p) + 5 audio tracks and
> completed a full download+merge. If YouTube ever 429s your server IP again,
> drop in `cookies.txt` (see below) as the fallback — authenticated requests
> are trusted far more.

## What you get

| Service      | Image / build                                      | Purpose                                  |
| ------------ | -------------------------------------------------- | ---------------------------------------- |
| `cobalt`     | `ghcr.io/imputnet/cobalt:latest`                   | Download API for Instagram/TikTok/etc. (port 9000) |
| `yt-session` | `ghcr.io/imputnet/yt-session-generator:webserver`  | YouTube proof-of-origin tokens (internal only) |
| `yt-backend` | `./yt-backend` (Node + yt-dlp + ffmpeg)            | **YouTube** info + downloads (port 3001→3000) |
| `watchtower` | `ghcr.io/nicholas-fedor/watchtower:latest`         | Auto-updates images daily                |

## Option A — VPS / any Docker host (recommended)

Any cheap VPS (Hetzner, DigitalOcean, etc.) or always-on machine with Docker.

```bash
# 1. Copy this folder to the server, then:
cp .env.example .env
nano .env   # set API_URL to your server's public URL, e.g. https://dl.yourdomain.com/

# 2. (Only if YouTube ever rate-limits you) export cookies.txt from your
#    logged-in browser — see yt-backend/cookies.README.txt — and place it at
#    yt-backend/cookies.txt. Not needed while plain requests work.

# 3. Start everything:
docker compose up -d

# 4. Verify:
curl http://localhost:9000/   # cobalt  -> JSON with a "cobalt" key
curl http://localhost:3001/   # yt-backend -> { ok: true, cookies: true/false }
```

Put a reverse proxy (nginx / Caddy) with HTTPS in front of ports 9000/3001,
or use your provider's load balancer. The cobalt `API_URL` **must** be the
exact public HTTPS URL or file tunnels break.

Test a YouTube download end-to-end:

```bash
curl -X POST http://localhost:3001/api/info \
  -H "Content-Type: application/json" \
  -d '{"url":"https://www.youtube.com/watch?v=dQw4w9WgXcQ"}'
```

## Option B — Render.com (dashboard)

You already run backends on Render, so this fits your setup. Two services:

**1. Session generator (private service)**
- New → Private Service → Docker → repo folder with `Dockerfile.yt-session`
- Port: `8080`
- Name it e.g. `toolverse-yt-session`

**2. cobalt API (web service)**
- New → Web Service → Docker → repo folder with `Dockerfile.cobalt`
- Name it e.g. `toolverse-download-api`
- Environment variables:
  - `API_URL` = `https://toolverse-download-api.onrender.com/` (your actual URL, trailing `/`)
  - `API_PORT` = `10000` (Render's default `PORT`)
  - `YOUTUBE_SESSION_SERVER` = `http://toolverse-yt-session:8080/` (private hostname of service 1)

> Render free web services sleep when idle — the first download after a nap
> takes ~30–60s to wake. A paid instance (or any always-on host) avoids this.

## Wire up the Toolverse frontend

- **Instagram Reels / Music tools** → **Advanced → API instance** → your cobalt URL
  (e.g. `https://toolverse-download-api.onrender.com/`). No human check needed
  on your own instance.
- **YouTube tool** → **Advanced → Server URL** → your yt-backend URL
  (e.g. `https://toolverse-yt-backend.onrender.com/`).

Want them as defaults for all visitors? Send me the URLs and I'll bake them in.

## Lock it down (recommended before sharing the URL)

An open instance with wildcard CORS can be used by anyone. Add an API key:

1. `cp keys.json.example keys.json` and put a long random string in `keys`.
2. In `docker-compose.yml`, uncomment the `keys.json` volume and the two
   `API_AUTH_REQUIRED` / `API_KEY_URL` lines. (On Render, upload the file and
   set the same two env vars + a volume/disk — or keep the key in an env var
   your way.)
3. `docker compose up -d` (or redeploy on Render).
4. In each Toolverse downloader: **Advanced → API key** → paste the key.
   The tools send it as `Authorization: Api-Key <key>`.

## Honest notes

- **YouTube**: the session generator exists to help YouTube work from server
  IPs. YouTube's datacenter blocking comes and goes — if downloads ever fail
  with 429/"sign in to confirm you're not a bot", add `cookies.txt` to
  yt-backend (see `yt-backend/cookies.README.txt`) and redeploy.
- **Rate limits**: defaults are 20 requests/min per IP (`RATELIMIT_MAX` /
  `RATELIMIT_WINDOW`). Raise them if your site gets busy.
- **Instance URL matters**: `API_URL` must exactly match the public URL or
  downloads return broken tunnel links.
- Check the supported services anytime: `curl https://your-server/`

## Useful commands

```bash
docker compose logs -f cobalt      # watch the API logs
docker compose logs -f yt-session # watch the YouTube token service
docker compose pull && docker compose up -d   # manual update (watchtower does this daily)
```
