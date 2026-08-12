import type { RequestHandler } from 'express';
import { User } from '../models/User.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const listUsers: RequestHandler = asyncHandler(async (_request, response) => {
  const users = await User.find().populate('shopId').sort({ role: 1, displayName: 1 });
  response.json({
    success: true,
    data: {
      users: users.map((user) => {
        const shop = user.shopId as unknown as
          | { _id?: unknown; name?: string; phone?: string; address?: string; latitude?: number | null; longitude?: number | null }
          | null;
        return {
          id: user.id,
          displayName: user.displayName,
          role: user.role,
          shopId: shop?._id ? String(shop._id) : null,
          isActive: user.isActive,
          shop: shop?._id
            ? { id: String(shop._id), name: shop.name, phone: shop.phone, address: shop.address, latitude: shop.latitude ?? null, longitude: shop.longitude ?? null }
            : null,
        };
      }),
    },
  });
});
