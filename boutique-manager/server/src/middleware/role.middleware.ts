import type { RequestHandler } from 'express';
import { USER_ROLES, type UserRole } from '../constants/roles.js';
import { Shop } from '../models/Shop.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { assertObjectId, routeParam } from '../utils/objectId.js';

export function requireRole(role: UserRole): RequestHandler {
  return (request, _response, next) => {
    if (!request.user) {
      next(new ApiError(401, 'Authentification requise.', 'AUTH_REQUIRED'));
      return;
    }
    if (request.user.role !== role) {
      next(new ApiError(403, 'Action non autorisée.', 'FORBIDDEN'));
      return;
    }
    next();
  };
}

export const requireAdmin = requireRole(USER_ROLES.ADMIN);
export const requireUser = requireRole(USER_ROLES.USER);

export const requireShopAccess: RequestHandler = asyncHandler(async (request, _response, next) => {
  if (!request.user) {
    throw new ApiError(401, 'Authentification requise.', 'AUTH_REQUIRED');
  }
  const shopId = routeParam(request.params.shopId, 'Boutique');
  assertObjectId(shopId, 'Boutique');

  if (request.user.role === USER_ROLES.USER) {
    throw new ApiError(403, 'Action non autorisée.', 'FORBIDDEN');
  }

  if (
    request.user.role === USER_ROLES.BOUTIQUE &&
    String(request.user.shopId) !== String(shopId)
  ) {
    throw new ApiError(403, 'Accès interdit à cette boutique.', 'SHOP_FORBIDDEN');
  }

  const exists = await Shop.exists({ _id: shopId });
  if (!exists) {
    throw new ApiError(404, 'Boutique introuvable.', 'SHOP_NOT_FOUND');
  }
  next();
});
