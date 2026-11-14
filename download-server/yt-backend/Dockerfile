# Toolverse YouTube backend: Node + yt-dlp + ffmpeg.
FROM node:22-slim

ARG CACHE_DATE=2026-10-28-03

# yt-dlp (standalone binary, needs python3) + ffmpeg + deno (for YT challenge extraction)
RUN apt-get update \
  && apt-get install -y --no-install-recommends curl ffmpeg ca-certificates python3 unzip \
  && (curl -fsSL https://deno.land/install.sh | DENO_INSTALL=/usr/local sh || true) \
  && ln -sf /usr/local/bin/node /usr/bin/node \
  && ln -sf /usr/local/bin/node /usr/bin/nodejs \
  && rm -rf /var/lib/apt/lists/* \
  && curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp \
       -o /usr/local/bin/yt-dlp \
  && chmod +x /usr/local/bin/yt-dlp \
  && yt-dlp --version

WORKDIR /app
COPY package*.json ./
RUN npm install --omit=dev
COPY server.js ./

EXPOSE 3000
CMD ["node", "server.js"]

