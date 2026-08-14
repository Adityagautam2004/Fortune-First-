const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const http = require('http'); // Add this native module
const { Server } = require('socket.io'); // Import Socket.io
require('dotenv').config();

const db = require('./models/db');
const apiRoutes = require('./routes');
const setupSocket = require('./services/socket.service'); // We will build this next
const swaggerUi = require('swagger-ui-express');
const openapiSpec = require('./docs/openapi.json');

const app = express();
const server = http.createServer(app); // Wrap Express in HTTP server

// Initialize Socket.io with CORS aligned to your frontend
const io = new Server(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true
  }
});

app.use(cors({ origin: process.env.CORS_ORIGIN || '*', credentials: true }));
app.use(express.json());
app.use(cookieParser());

app.use('/api/v1', apiRoutes);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(openapiSpec));

// Initialize the socket event listeners
setupSocket(io);

const PORT = process.env.PORT || 4000;

// IMPORTANT: Change app.listen to server.listen
server.listen(PORT, () => {
  console.log(`🚀 Server gracefully running on port ${PORT} with WebSockets enabled`);
});