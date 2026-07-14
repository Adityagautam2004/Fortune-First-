const express = require('express');
const cors = require('cors');
require('dotenv').config();

const db = require('./models/db'); // Loads our raw SQL database connection pool

const app = express();
const PORT = process.env.PORT || 4000;

// Universal Middlewares
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*', // Whitelists frontend traffic later
  credentials: true
}));
app.use(express.json()); // Allows our server to read JSON payloads sent by users

// A simple health-check route to ensure the server answers external requests
app.get('/api/v1/health', async (req, res) => {
  try {
    // Tests the real database connection live
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

// Start listening for web API requests
app.listen(PORT, () => {
  console.log(`🚀 Server gracefully running on port ${PORT}`);
});