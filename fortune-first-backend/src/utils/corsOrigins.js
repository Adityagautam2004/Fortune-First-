// CORS_ORIGIN can be a single URL or a comma-separated list (e.g. local dev +
// the deployed frontend at once): "http://localhost:3000,https://app.vercel.app"
const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:3000')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

// The first entry is treated as the primary frontend URL — used to build
// links in outgoing emails (password reset, etc.), where only one URL fits.
const primaryOrigin = allowedOrigins[0];

module.exports = { allowedOrigins, primaryOrigin };
