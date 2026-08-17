const multer = require('multer');
const ApiError = require('../utils/apiError');

const ALLOWED_MIME_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

// Memory storage — the file never touches disk, it's streamed straight to
// Cloudinary from the buffer (see utils/cloudinary.js).
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE_BYTES },
  fileFilter: (req, file, cb) => {
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      return cb(ApiError.badRequest('Only PDF, JPG, or PNG files are allowed'));
    }
    cb(null, true);
  },
});

module.exports = upload;
