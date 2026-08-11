import { Router } from 'express';
import { createShop, deleteShop } from '../controllers/shop.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { requireAdmin } from '../middleware/role.middleware.js';

export const shopRouter = Router();
shopRouter.post('/', requireAuth, requireAdmin, createShop);
shopRouter.delete('/:shopId', requireAuth, requireAdmin, deleteShop);
