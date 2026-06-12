const { Pool } = require('pg');

// The connection string comes from the environment variables we set in docker-compose.yml
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

pool.on('connect', () => {
  console.log('🔗 Connected to the PostgreSQL database');
});

module.exports = {
  // This allows us to use db.query() anywhere in our app
  query: (text, params) => pool.query(text, params),
  pool
};