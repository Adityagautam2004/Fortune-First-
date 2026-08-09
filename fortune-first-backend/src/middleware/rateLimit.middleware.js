const redis = require('../utils/redis');

const loginRateLimiter = async (req, res, next) => {
  try {
    const clientIp = req.ip || req.headers['x-forwarded-for'] || '127.0.0.1';
    const key = `rate_limit:login:${clientIp}`;

    const currentAttempts = await redis.incr(key);

    if (currentAttempts === 1) {
      // Set 15-minute window expiration on first attempt
      await redis.expire(key, 900);
    }

    if (currentAttempts > 5) {
      return res.status(429).json({
        status: 'error',
        message: 'Too many failed login attempts. Please try again after 15 minutes.'
      });
    }

    next();
  } catch (error) {
    // If Redis fails, log and bypass to maintain application availability
    console.error('Rate limiting middleware error:', error.message);
    next();
  }
};

module.exports = { loginRateLimiter };