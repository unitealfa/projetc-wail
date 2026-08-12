import { Router } from 'express';
import {
  createProduct,
  autofillProductFromImages,
  deleteProduct,
  getProduct,
  listProducts,
  retryProductAnalysis,
  updateProduct,
} from '../controllers/product.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { requireShopAccess } from '../middleware/role.middleware.js';
import { productAutofillImageUpload, productImageUpload } from '../middleware/upload.middleware.js';

export const productRouter = Router({ mergeParams: true });
productRouter.use(requireAuth, requireShopAccess);
productRouter.get('/', listProducts);
productRouter.post('/autofill', productAutofillImageUpload, autofillProductFromImages);
productRouter.post('/', productImageUpload, createProduct);
productRouter.get('/:productId', getProduct);
productRouter.post('/:productId/retry-analysis', retryProductAnalysis);
productRouter.patch('/:productId', productImageUpload, updateProduct);
productRouter.delete('/:productId', deleteProduct);
