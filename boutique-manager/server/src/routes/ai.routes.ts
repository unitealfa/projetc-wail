import { Router } from 'express';
import { searchProductByImage } from '../controllers/ai.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { requireUser } from '../middleware/role.middleware.js';
import { searchImageUpload } from '../middleware/upload.middleware.js';

export const aiRouter = Router();
aiRouter.post('/product-search', requireAuth, requireUser, searchImageUpload, searchProductByImage);
