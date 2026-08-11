import type { RequestHandler } from 'express';
import { connectDB } from '../config/db.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ensureAdminExists } from '../services/seed.service.js';

export const databaseMiddleware: RequestHandler = asyncHandler(async (_request, _response, next) => {
  await connectDB();
  await ensureAdminExists();
  next();
});
