const ApiError = require('../utils/apiError');

/**
 * Global Express error-handling middleware.
 * Must be registered LAST with `app.use(errorHandler)`.
 *
 * - Catches `ApiError` instances and returns their status + message.
 * - Catches unknown/programming errors and returns a generic 500.
 */
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, _req, res, _next) => {
  // Default to 500 if no status code is set
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal server error';
  let status = err.status || 'error';

  // Postgres unique-violation (e.g. duplicate email)
  if (err.code === '23505') {
    statusCode = 409;
    message = 'A record with that value already exists';
    status = 'fail';
  }

  // Postgres foreign-key violation
  if (err.code === '23503') {
    statusCode = 400;
    message = 'Referenced record does not exist';
    status = 'fail';
  }

  // Postgres check-constraint violation (e.g. amount < 5000)
  if (err.code === '23514') {
    statusCode = 400;
    message = 'Value violates a database constraint';
    status = 'fail';
  }

  // Log unexpected (non-operational) errors for debugging
  if (!(err instanceof ApiError) || !err.isOperational) {
    console.error('💥 Unexpected error:', err);
  }

  res.status(statusCode).json({
    success: false,
    status,
    message,
    // Only expose the stack trace in development mode
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

module.exports = errorHandler;
