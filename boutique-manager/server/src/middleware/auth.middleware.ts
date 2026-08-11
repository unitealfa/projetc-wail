import type { RequestHandler } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { User } from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { assertObjectId } from '../utils/objectId.js';

export const requireAuth: RequestHandler = asyncHandler(async (request, _response, next) => {
  const authorization = request.header('authorization');
  if (!authorization?.startsWith('Bearer ')) {
    throw new ApiError(401, 'Authentification requise.', 'AUTH_REQUIRED');
  }

  const token = authorization.slice(7).trim();
  let payload: jwt.JwtPayload;
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET);
    if (typeof decoded === 'string') {
      throw new Error('Payload invalide');
    }
    payload = decoded;
  } catch {
    throw new ApiError(401, 'Session invalide ou expirée.', 'INVALID_TOKEN');
  }

  if (typeof payload.userId !== 'string') {
    throw new ApiError(401, 'Session invalide.', 'INVALID_TOKEN');
  }
  try {
    assertObjectId(payload.userId, 'Utilisateur');
  } catch {
    throw new ApiError(401, 'Session invalide.', 'INVALID_TOKEN');
  }

  const user = await User.findById(payload.userId);
  if (!user || !user.isActive) {
    throw new ApiError(401, 'Session invalide.', 'INVALID_SESSION');
  }
  request.user = user;
  next();
});
