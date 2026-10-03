const redis = require('./redis');

// Read-through cache helpers. Redis is an optimisation, never a dependency:
// every helper fails open (cache miss / no-op) so an unavailable Redis means
// slower responses, not 500s. While the connection is down, commands are
// skipped outright instead of queuing behind ioredis' reconnect/timeout.

const isReady = () => redis.status === 'ready';

/** @returns {Promise<any|null>} parsed value, or null on miss / Redis unavailable */
const getJSON = async (key) => {
  if (!isReady()) return null;
  try {
    const raw = await redis.get(key);
    return raw ? JSON.parse(raw) : null;
  } catch (error) {
    console.error(`Cache read failed (${key}):`, error.message);
    return null;
  }
};

const setJSON = async (key, value, ttlSeconds) => {
  if (!isReady()) return;
  try {
    await redis.set(key, JSON.stringify(value), 'EX', ttlSeconds);
  } catch (error) {
    console.error(`Cache write failed (${key}):`, error.message);
  }
};

/** Binary values (e.g. generated PDFs) are stored base64-encoded. */
const getBuffer = async (key) => {
  if (!isReady()) return null;
  try {
    const raw = await redis.get(key);
    return raw ? Buffer.from(raw, 'base64') : null;
  } catch (error) {
    console.error(`Cache read failed (${key}):`, error.message);
    return null;
  }
};

const setBuffer = async (key, buffer, ttlSeconds) => {
  if (!isReady()) return;
  try {
    await redis.set(key, buffer.toString('base64'), 'EX', ttlSeconds);
  } catch (error) {
    console.error(`Cache write failed (${key}):`, error.message);
  }
};

const del = async (...keys) => {
  if (!keys.length || !isReady()) return;
  try {
    await redis.del(...keys);
  } catch (error) {
    console.error(`Cache delete failed (${keys.join(', ')}):`, error.message);
  }
};

/**
 * Delete every key matching a glob pattern using incremental SCAN — unlike
 * KEYS, it never blocks Redis while walking the keyspace.
 */
const delByPattern = async (pattern) => {
  if (!isReady()) return;
  try {
    const stream = redis.scanStream({ match: pattern, count: 200 });
    for await (const keys of stream) {
      if (keys.length) await redis.unlink(...keys);
    }
  } catch (error) {
    console.error(`Cache pattern delete failed (${pattern}):`, error.message);
  }
};

// ── Per-customer caches ────────────────────────────────────────────────────
const customerDashboardKey = (customerId) => `dashboard:${customerId}`;
const customerReportKey = (customerId, suffix) => `report_pdf:${customerId}:${suffix}`;

/**
 * Drop everything cached for one customer — their dashboard figures and
 * their generated PDF reports. Call after anything that changes their
 * investments, withdrawals, payouts or profile.
 */
const invalidateCustomerCaches = async (customerId) => {
  if (!customerId) return;
  await Promise.all([del(customerDashboardKey(customerId)), delByPattern(customerReportKey(customerId, '*'))]);
};

module.exports = {
  getJSON,
  setJSON,
  getBuffer,
  setBuffer,
  del,
  delByPattern,
  customerDashboardKey,
  customerReportKey,
  invalidateCustomerCaches,
};
