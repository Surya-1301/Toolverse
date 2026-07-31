FROM node:22-bookworm-slim

RUN apt-get update \
  && apt-get install -y --no-install-recommends ghostscript \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./

RUN npm install --omit=dev

COPY server.js ./

ENV NODE_ENV=production

EXPOSE 4000

CMD ["npm", "start"]