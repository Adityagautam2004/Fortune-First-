const multer = require('multer');
const ApiError = require('../utils/apiError');

const DOCUMENT_MIME_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
const IMAGE_MIME_TYPES = ['image/jpeg', 'image/png', 'image/jpg'];
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

// Memory storage — the file never touches disk, it's streamed straight to
// Cloudinary from the buffer (see utils/cloudinary.js).
const makeUploader = (allowedMimeTypes, rejectionMessage) =>
  multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: MAX_FILE_SIZE_BYTES },
    fileFilter: (req, file, cb) => {
      if (!allowedMimeTypes.includes(file.mimetype)) {
        return cb(ApiError.badRequest(rejectionMessage));
      }
      cb(null, true);
    },
  });

// KYC/identity documents — PDF or image (unchanged from before)
const upload = makeUploader(DOCUMENT_MIME_TYPES, 'Only PDF, JPG, or PNG files are allowed');

// Payment screenshots and profile pictures — image only, no PDF
const uploadImage = makeUploader(IMAGE_MIME_TYPES, 'Only JPG or PNG images are allowed');

module.exports = { upload, uploadImage };
