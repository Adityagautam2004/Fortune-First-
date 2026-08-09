const express = require('express');
const cors = require('cors');
require('dotenv').config();

const db = require('./models/db'); 

// 1. Import the centralized router from the routes directory
const apiRoutes = require('./routes'); 

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors({
  origin: process.env.CORS_ORIGIN || '*', 
  credentials: true
}));
app.use(express.json()); 

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

// 2. Mount the entire centralized routing system under the /api/v1 prefix
app.use('/api/v1', apiRoutes);

app.listen(PORT, () => {
  console.log(`🚀 Server gracefully running on port ${PORT}`);
});