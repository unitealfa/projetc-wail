import multer from 'multer';
import { ApiError } from '../utils/ApiError.js';

export const MAX_PRODUCT_IMAGE_SIZE = 3 * 1024 * 1024;
const allowedMimeTypes = new Set(['image/jpeg', 'image/png', 'image/webp']);

function imageFilter(_request: Express.Request, file: Express.Multer.File, callback: multer.FileFilterCallback) {
  if (!allowedMimeTypes.has(file.mimetype)) {
    callback(new ApiError(400, 'Format image non accepté (JPEG, PNG ou WEBP).', 'INVALID_IMAGE_TYPE'));
    return;
  }
  callback(null, true);
}

export const productImageUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_PRODUCT_IMAGE_SIZE, files: 1 },
  fileFilter: imageFilter,
}).single('image');

export const searchImageUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter: imageFilter,
}).single('image');
