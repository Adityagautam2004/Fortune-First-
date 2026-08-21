const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const http = require('http'); // Add this native module
const { Server } = require('socket.io'); // Import Socket.io
require('dotenv').config();

const db = require('./models/db');
const apiRoutes = require('./routes');
const setupSocket = require('./services/socket.service'); // We will build this next
const ApiError = require('./utils/apiError');
const errorHandler = require('./middleware/errorHandler');
const { allowedOrigins } = require('./utils/corsOrigins');

const app = express();
// Render (and most PaaS) terminate TLS and forward requests to the container
// over plain HTTP — without this, req.secure is always false and req.ip is
// always the proxy's own address, never the real client's (breaking the
// login rate limiter, which buckets by req.ip, and any secure-cookie logic).
app.set('trust proxy', 1);
const server = http.createServer(app); // Wrap Express in HTTP server

// Backstop for any request that hangs (e.g. a stalled DB/Redis connection
// that outlives its own client-level timeout) — cuts it off with a clean
// error instead of leaving the frontend spinning forever. Comfortably above
// the DB (10-15s) and Redis (10s) timeouts, and above normal PDF-generation time.
server.requestTimeout = 30_000;

// Initialize Socket.io with CORS aligned to your frontend(s)
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    credentials: true
  }
});

app.use(helmet());
app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(express.json());
app.use(cookieParser());

// Health check — used by Render (and anyone else) to confirm the service and DB are up
app.get('/api/v1/health', async (req, res) => {
  try {
    const dbTest = await db.query('SELECT NOW()');
    return res.status(200).json({
      status: 'success',
      message: 'Fortune First Backend is healthy and operational!',
      dbTime: dbTest.rows[0].now
    });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: error.message });
  }
});

app.use('/api/v1', apiRoutes);

// 404 catch-all for unmatched routes
app.all('*', (req, _res, next) => {
  next(ApiError.notFound(`Route ${req.method} ${req.originalUrl} not found`));
});

// Global error handler (must be registered LAST)
app.use(errorHandler);

// Initialize the socket event listeners
setupSocket(io);

const PORT = process.env.PORT || 4000;

// Only actually bind to a port when this file is the process entry point
// (`node src/app.js` / Docker's CMD) — not when a test file `require()`s it
// to get `app` for supertest, which would otherwise fight over the port.
if (require.main === module) {
  server.listen(PORT, () => {
    console.log(`🚀 Server gracefully running on port ${PORT} with WebSockets enabled`);
  });
}

module.exports = { app, server };