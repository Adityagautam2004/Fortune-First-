# Use a lightweight Node.js image
FROM node:20-alpine

# Puppeteer's own Chrome download doesn't work reliably on Alpine (musl libc) —
# use the system chromium package instead and point Puppeteer at it.
# Alpine ships no fonts: without these, PDF statements render text (and the
# ₹ sign) as empty boxes. Noto/DejaVu both include the rupee glyph.
RUN apk add --no-cache chromium font-noto ttf-dejavu
ENV PUPPETEER_SKIP_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

WORKDIR /app

# Copy dependency manifests first for layer caching.
COPY package*.json ./
RUN npm ci --omit=dev

COPY . .

EXPOSE 4000
CMD ["npm", "start"]