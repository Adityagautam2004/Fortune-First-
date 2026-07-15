const ApiError = require('../utils/apiError');
const { verifyToken } = require('../utils/generateToken');

/**
 * Middleware: authenticate
 * Extracts and verifies the JWT from the Authorization header.
 * Attaches the decoded user payload to `req.user`.
 */
const authenticate = (req, _res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw ApiError.unauthorized('Authentication token is missing');
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);

    // Attach the decoded JWT payload for downstream middleware & controllers
    req.user = decoded;
    next();
  } catch (error) {
    if (error instanceof ApiError) {
      return next(error);
    }
    // jsonwebtoken errors (expired, malformed, etc.)
    return next(ApiError.unauthorized('Invalid or expired authentication token'));
  }
};

/**
 * Middleware factory: authorize
 * Restricts access to users whose role is in the allowed list.
 *
 * @param  {...string} allowedRoles - e.g. 'super_admin', 'business_head'
 * @returns {import('express').RequestHandler}
 *
 * @example
 *   router.get('/admin-only', authenticate, authorize('super_admin'), handler);
 */
const authorize = (...allowedRoles) => {
  return (req, _res, next) => {
    if (!req.user) {
      return next(ApiError.unauthorized('Authentication required'));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        ApiError.forbidden(
          `Role '${req.user.role}' is not authorized to access this resource`
        )
      );
    }

    next();
  };
};

module.exports = { authenticate, authorize };
