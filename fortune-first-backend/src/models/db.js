require('dotenv').config();
const { Pool } = require('pg');

if (!process.env.DATABASE_URL) {
  console.warn('DATABASE_URL is not set; database-backed routes will be unavailable.');
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: Number(process.env.DB_POOL_MAX) || 10,
  // pg's default connectionTimeoutMillis is 0 (no timeout) — a stalled
  // handshake to a remote DB (Neon) would hang the request forever instead
  // of failing fast. statement_timeout guards the same way for a query that
  // connects fine but then never gets a response.
  connectionTimeoutMillis: 10_000,
  statement_timeout: 15_000,
});

pool.on('connect', () => {
  console.log('Connected to the PostgreSQL database');
});

pool.on('error', (error) => {
  console.error('Unexpected PostgreSQL pool error', error);
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool,
};