# Toolverse YouTube backend: Node + yt-dlp + ffmpeg.
FROM node:22-slim

# yt-dlp (standalone binary) + ffmpeg (merging video+audio, MP3 extraction)
RUN apt-get update \
  && apt-get install -y --no-install-recommends curl ffmpeg ca-certificates \
  && rm -rf /var/lib/apt/lists/* \
  && curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp \
       -o /usr/local/bin/yt-dlp \
  && chmod +x /usr/local/bin/yt-dlp \
  && yt-dlp --version

WORKDIR /app
COPY package*.json ./
RUN npm install --omit=dev
COPY server.js ./

# Optional: bake in cookies.txt at build time (or mount/provide at runtime).
# COPY cookies.txt ./

EXPOSE 3000
CMD ["node", "server.js"]
