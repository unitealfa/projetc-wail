import { Router } from 'express';
import { getAuthOptions, getMe, mockLogin } from '../controllers/auth.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';

export const authRouter = Router();
authRouter.get('/options', getAuthOptions);
authRouter.post('/mock-login', mockLogin);
authRouter.get('/me', requireAuth, getMe);
