import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import type { UserDocument } from '../models/User.js';

export function createAccessToken(user: UserDocument): string {
  return jwt.sign({ userId: user.id }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'],
  });
}

export function toAuthUser(user: UserDocument) {
  return {
    id: user.id,
    displayName: user.displayName,
    role: user.role,
    shopId: user.shopId ? String(user.shopId) : null,
  };
}
