import type { RequestHandler } from 'express';
import { createShopSchema, updateShopSchema } from '../schemas/shop.schema.js';
import { createShopWithUser, deleteShopCascade, updateShopDetails } from '../services/shop.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { assertObjectId, routeParam } from '../utils/objectId.js';

export const createShop: RequestHandler = asyncHandler(async (request, response) => {
  const input = createShopSchema.parse(request.body);
  const { shop, user } = await createShopWithUser(input);
  response.status(201).json({
    success: true,
    data: {
      shop: { id: shop.id, name: shop.name, phone: shop.phone, address: shop.address, latitude: shop.latitude ?? null, longitude: shop.longitude ?? null },
      user: { id: user.id, displayName: user.displayName, role: user.role, shopId: String(user.shopId) },
    },
  });
});

export const updateShop: RequestHandler = asyncHandler(async (request, response) => {
  const shopId = routeParam(request.params.shopId, 'Boutique');
  assertObjectId(shopId, 'Boutique');
  const input = updateShopSchema.parse(request.body);
  const { shop, user } = await updateShopDetails(shopId, input);
  response.json({
    success: true,
    data: {
      shop: { id: shop.id, name: shop.name, phone: shop.phone, address: shop.address, latitude: shop.latitude ?? null, longitude: shop.longitude ?? null },
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
