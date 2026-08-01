FROM node:22-bookworm-slim

RUN apt-get update \
  && apt-get install -y --no-install-recommends \
    ghostscript \
    python3 \
    python3-pip \
    poppler-utils \
    tesseract-ocr \
    tesseract-ocr-eng \
    qpdf \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./

RUN npm install --omit=dev

RUN pip3 install --break-system-packages \
  markitdown[all] \
  pytesseract \
  pdf2image \
  Pillow \
  PyMuPDF

COPY server.js ./

ENV NODE_ENV=production

EXPOSE 4000

CMD ["npm", "start"]