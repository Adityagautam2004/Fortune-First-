const ApiError = require('../utils/apiError');

/**
 * Middleware factory: validate
 * Validates `req.body` (or another source) against a Joi schema.
 *
 * @param {import('joi').ObjectSchema} schema - Joi validation schema
 * @param {'body'|'query'|'params'} [source='body'] - Part of the request to validate
 * @returns {import('express').RequestHandler}
 *
 * @example
 *   const Joi = require('joi');
 *   const loginSchema = Joi.object({ email: Joi.string().email().required() });
 *   router.post('/login', validate(loginSchema), authController.login);
 */
const validate = (schema, source = 'body') => {
  return (req, _res, next) => {
    const { error, value } = schema.validate(req[source], {
      abortEarly: false,   // Collect all errors, not just the first one
      stripUnknown: true,  // Remove any fields not defined in the schema
    });

    if (error) {
      const messages = error.details.map((d) => d.message).join('; ');
      return next(ApiError.badRequest(messages));
    }

    // Replace the original source with the cleaned/validated data
    req[source] = value;
    next();
  };
};

module.exports = validate;
