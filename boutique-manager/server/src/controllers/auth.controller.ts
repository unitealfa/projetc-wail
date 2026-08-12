import type { RequestHandler } from 'express';
import { env } from '../config/env.js';
import { USER_ROLES } from '../constants/roles.js';
import { User } from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { assertObjectId } from '../utils/objectId.js';
import { createAccessToken, toAuthUser } from '../services/auth.service.js';

function assertMockAuthEnabled(): void {
  if (!env.MOCK_AUTH_ENABLED) {
    throw new ApiError(404, 'Route introuvable.', 'ROUTE_NOT_FOUND');
  }
}

export const getAuthOptions: RequestHandler = asyncHandler(async (_request, response) => {
  assertMockAuthEnabled();
  const [admin, boutiques, users] = await Promise.all([
    User.findOne({ role: USER_ROLES.ADMIN, isActive: true }),
    User.find({ role: USER_ROLES.BOUTIQUE, isActive: true }).populate('shopId').sort({ displayName: 1 }),
    User.find({ role: USER_ROLES.USER, isActive: true }).sort({ displayName: 1 }),
  ]);
  if (!admin) {
    throw new ApiError(500, 'Administrateur indisponible.', 'ADMIN_UNAVAILABLE');
  }

  response.json({
    success: true,
    data: {
      admin: { userId: admin.id, displayName: admin.displayName },
      boutiques: boutiques.flatMap((user) => {
        const shop = user.shopId as unknown as { _id?: unknown; name?: string } | null;
        return shop?._id
          ? [{ userId: user.id, displayName: user.displayName, shopId: String(shop._id), shopName: shop.name ?? user.displayName }]
          : [];
      }),
      users: users.map((user) => ({ userId: user.id, displayName: user.displayName })),
    },
  });
});

export const mockLogin: RequestHandler = asyncHandler(async (request, response) => {
  assertMockAuthEnabled();
  const userId = request.body?.userId;
  if (typeof userId !== 'string') {
    throw new ApiError(400, 'userId est obligatoire.', 'VALIDATION_ERROR');
  }
  assertObjectId(userId, 'Utilisateur');
  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(404, 'Utilisateur introuvable.', 'USER_NOT_FOUND');
  }
  if (!user.isActive) {
    throw new ApiError(403, 'Utilisateur désactivé.', 'USER_INACTIVE');
  }

  response.json({
    success: true,
    data: { token: createAccessToken(user), user: toAuthUser(user) },
  });
});

export const getMe: RequestHandler = (request, response) => {
  response.json({ success: true, data: { user: toAuthUser(request.user!) } });
};
