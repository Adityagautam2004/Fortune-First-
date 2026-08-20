const Redis = require('ioredis');

// Connects to Redis container using REDIS_URL from docker-compose.yml
const redis = new Redis(process.env.REDIS_URL || 'redis://redis:6379', {
  maxRetriesPerRequest: 3,
  retryStrategy(times) {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  connectTimeout: 10_000,
  commandTimeout: 10_000,
});

redis.on('connect', () => {
  console.log('⚡ Connected to Redis successfully');
});

redis.on('error', (err) => {
  console.error('❌ Redis Connection Error:', err.message);
});

module.exports = redis;