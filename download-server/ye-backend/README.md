# ye-backend — Toolverse YouTube backend, YoutubeExplode method (no yt-dlp)

A drop-in replacement for `yt-backend` with the **same API**, so the frontend
only changes its base URL. Built on the real
[YoutubeExplode](https://github.com/Tyrrrz/YoutubeExplode) library (the engine
inside Tyrrrz/YoutubeDownloader) plus YoutubeExplode.Converter (ffmpeg muxing).

## The method (traced from the YoutubeExplode source)

1. `visitorData` is fetched from `youtube.com/sw.js_data` with an Android
   user-agent, from a fixed position in the JSON blob.
2. The player response comes from `youtubei/v1/player`, client **VISIONOS**
   first, **ANDROID** as fallback, `TVHTML5_SIMPLY_EMBEDDED_PLAYER` when a
   signature timestamp is known (age-gated videos; stream URLs then need
   signature deciphering, which YoutubeExplode does internally from YouTube's
   player JS).
3. Stream URLs come from the player response's `streamingData`. No stream
   URLs exist until the player call succeeds.
4. Auth (optional): SOCS consent cookie is generated automatically;
   user-supplied cookies are accepted and a `SAPISIDHASH` header is built
   from SAPISID cookies when present.

One deliberate deviation: metadata does **not** go through YoutubeExplode's
`Videos.GetAsync()`, because that starts from the HTML watch page, which
datacenter IPs get bot-checked on. Metadata comes from a raw player POST
(the same VISIONOS → ANDROID flow); streams and downloads still go through
YoutubeExplode itself. Verified locally 2026-10-26: full info ladder
(144p–2160p + audio) and real 144p MP4 (h264 + AAC) and MP3 downloads.

## API (identical to yt-backend)

- `GET /` → `{ ok, service: "toolverse-ye-backend", engine: "YoutubeExplode", cookies, maxMinutes }`
- `POST /api/info` `{url}` → `{ title, thumbnail, duration, uploader,
  isLive, resources[], qualities[], hasAudio, cookies }`
  - Video resource ids are `v<height>` (e.g. `v720`); the audio resource id
    is `audio`. (yt-backend used yt-dlp format ids; this service generates
    its own ids, and the frontend passes back whatever `/api/info` returned,
    so the two are interchangeable.)
- `GET /api/download?url=&format_id=&quality=&audio=0|1` → file attachment.
  `format_id` = a resource id from `/api/info`; omit it and `quality=720`
  auto-picks. `audio=1` returns MP3.

## Deploy on Render

1. Copy this folder to `download-server/ye-backend/` in the Toolverse repo and
   `Dockerfile.ye-backend` to `download-server/Dockerfile.ye-backend/`.
2. Render dashboard → New → Web Service → Docker, repo `Toolverse`,
   Dockerfile Path `./download-server/Dockerfile.ye-backend`.
3. Environment:
   - `API_KEY` — **same value** as in `lib/downloadServers.ts`.
   - `CORS_ORIGIN` — `https://toolversee.pages.dev`
   - `COOKIES_B64` — only if this IP ever gets flagged (never commit cookies).
4. Deploy, then point the frontend at it: in `lib/downloadServers.ts`,
   change `PRIVATE_YT_BACKEND` to the new Render URL. Nothing else changes.

## Verify after deploy (the deciding test)

The player call is what YouTube blocks per-IP, so the first check on the new
service is the whole story:

```
curl -X POST https://<your-ye-backend>.onrender.com/api/info \
  -H "Content-Type: application/json" \
  -H "x-api-key: <API_KEY>" \
  -d '{"url":"https://www.youtube.com/watch?v=aqz-KE-bpKQ"}'
```

If it returns the resource table, the backend works from Render's IP. If it
returns `Could not fetch video info`, Render's IP is still flagged and no
library switch fixes that — only a different IP (proxy) or a paid API does.

## Local run

```
dotnet run --project ye-backend
# listens on :3000 (or $PORT); ffmpeg must be on PATH for muxing/MP3
```

## Env reference

| Var | Default | Purpose |
| --- | ------- | ------- |
| `PORT` | 3000 | Listen port (Render injects its own) |
| `API_KEY` | (unset = open) | Gates `/api/*` via `x-api-key` header or `?api_key=` |
| `CORS_ORIGIN` | `*` | Comma-separated allowed origins |
| `TMPDIR` | system temp | In-progress downloads |
| `MAX_MINUTES` | 10 | Per-download timeout |
| `CACHE_MIN` | 10 | Info/manifest cache TTL |
| `FFMPEG_PATH` | `ffmpeg` | ffmpeg binary for muxing/MP3 |
| `COOKIES_B64` | (unset) | Base64 Netscape cookies; or `cookies.txt` next to the binary |

## Known limitations

- `audio_format` other than `mp3` falls back to `mp3` (the Converter has no
  m4a target; yt-backend's default was mp3 anyway).
- `isLive` is always `false` (the player `videoDetails` used here carries no
  live flag); livestreams are not a supported download case.
- Rare ciphered streams need the watch page for the signature timestamp; if
  that path is bot-checked on a given IP, those streams fail while the
  normal VISIONOS/ANDROID streams still work.
