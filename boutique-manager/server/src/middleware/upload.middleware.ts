import multer from 'multer';
import { ApiError } from '../utils/ApiError.js';

export const MAX_PRODUCT_IMAGE_SIZE = 3 * 1024 * 1024;
const allowedMimeTypes = new Set(['image/jpeg', 'image/png', 'image/webp']);

export const productImageUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_PRODUCT_IMAGE_SIZE, files: 1 },
  fileFilter: (_request, file, callback) => {
    if (!allowedMimeTypes.has(file.mimetype)) {
      callback(new ApiError(400, 'Format image non accepté (JPEG, PNG ou WEBP).', 'INVALID_IMAGE_TYPE'));
      return;
    }
    callback(null, true);
  },
}).single('image');
