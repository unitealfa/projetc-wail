import type { RequestHandler } from 'express';
import { createShopSchema } from '../schemas/shop.schema.js';
import { createShopWithUser, deleteShopCascade } from '../services/shop.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { assertObjectId, routeParam } from '../utils/objectId.js';

export const createShop: RequestHandler = asyncHandler(async (request, response) => {
  const input = createShopSchema.parse(request.body);
  const { shop, user } = await createShopWithUser(input);
  response.status(201).json({
    success: true,
    data: {
      shop: { id: shop.id, name: shop.name, phone: shop.phone, address: shop.address },
      user: { id: user.id, displayName: user.displayName, role: user.role, shopId: String(user.shopId) },
    },
  });
});

export const deleteShop: RequestHandler = asyncHandler(async (request, response) => {
  const shopId = routeParam(request.params.shopId, 'Boutique');
  assertObjectId(shopId, 'Boutique');
  await deleteShopCascade(shopId);
  response.json({ success: true, data: { deleted: true } });
});
