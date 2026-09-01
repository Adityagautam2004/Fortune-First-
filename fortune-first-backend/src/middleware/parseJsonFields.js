const ApiError = require('../utils/apiError');

// A multipart/form-data body can't carry nested arrays/objects natively —
// the frontend JSON.stringifies them before appending to FormData, so this
// parses them back before Joi (which expects real arrays/objects) ever sees
// req.body. Must run after multer, before validate().
const parseJsonFields = (fields) => (req, res, next) => {
  for (const field of fields) {
    if (typeof req.body[field] === 'string') {
      try {
        req.body[field] = JSON.parse(req.body[field]);
      } catch {
        return next(ApiError.badRequest(`"${field}" must be valid JSON`));
      }
    }
  }
  next();
};

module.exports = parseJsonFields;
