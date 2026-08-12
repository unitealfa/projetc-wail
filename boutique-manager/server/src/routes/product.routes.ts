import { Router } from 'express';
import {
  createProduct,
  deleteProduct,
  getProduct,
  listProducts,
  retryProductAnalysis,
  updateProduct,
} from '../controllers/product.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { requireShopAccess } from '../middleware/role.middleware.js';
import { productImageUpload } from '../middleware/upload.middleware.js';

export const productRouter = Router({ mergeParams: true });
productRouter.use(requireAuth, requireShopAccess);
productRouter.get('/', listProducts);
productRouter.post('/', productImageUpload, createProduct);
productRouter.get('/:productId', getProduct);
productRouter.post('/:productId/retry-analysis', retryProductAnalysis);
productRouter.patch('/:productId', productImageUpload, updateProduct);
productRouter.delete('/:productId', deleteProduct);
