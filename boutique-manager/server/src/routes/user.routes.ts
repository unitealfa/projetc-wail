import { Router } from 'express';
import { listUsers } from '../controllers/user.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { requireAdmin } from '../middleware/role.middleware.js';

export const userRouter = Router();
userRouter.get('/', requireAuth, requireAdmin, listUsers);
