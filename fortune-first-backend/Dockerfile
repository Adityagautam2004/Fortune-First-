# Use a lightweight Node.js image
FROM node:20-alpine

WORKDIR /app

# Copy dependency manifests first for layer caching.
COPY package*.json ./
RUN npm ci --omit=dev

COPY . .

EXPOSE 4000
CMD ["npm", "start"]