import mongoose from 'mongoose';
import { USER_ROLES } from '../constants/roles.js';
import { Product } from '../models/Product.js';
import { Shop } from '../models/Shop.js';
import { User } from '../models/User.js';
import type { CreateShopInput, UpdateShopInput } from '../schemas/shop.schema.js';
import { ApiError } from '../utils/ApiError.js';
import { deleteProductImage } from './storage.service.js';

export async function createShopWithUser(input: CreateShopInput) {
  const shop = await Shop.create(input);
  try {
    const user = await User.create({
      displayName: shop.name,
      role: USER_ROLES.BOUTIQUE,
      shopId: shop._id,
      isActive: true,
    });
    return { shop, user };
  } catch (error) {
    await Shop.deleteOne({ _id: shop._id });
    throw error;
  }
}

export async function updateShopDetails(shopId: string, input: UpdateShopInput) {
  const shop = await Shop.findByIdAndUpdate(shopId, input, { new: true, runValidators: true });
  if (!shop) {
    throw new ApiError(404, 'Boutique introuvable.', 'SHOP_NOT_FOUND');
  }
  const user = await User.findOneAndUpdate(
    { shopId, role: USER_ROLES.BOUTIQUE },
    { displayName: shop.name },
    { new: true },
  );
  if (!user) {
    throw new ApiError(404, 'Compte boutique introuvable.', 'SHOP_USER_NOT_FOUND');
  }
  return { shop, user };
}

export async function deleteShopCascade(shopId: string): Promise<void> {
  const shop = await Shop.findById(shopId);
  if (!shop) {
    throw new ApiError(404, 'Boutique introuvable.', 'SHOP_NOT_FOUND');
  }

  const products = await Product.find({ shopId }).select('imageStorageKey').lean();
  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      await Product.deleteMany({ shopId }).session(session);
      await User.deleteMany({ shopId, role: USER_ROLES.BOUTIQUE }).session(session);
      const deletion = await Shop.deleteOne({ _id: shopId }).session(session);
      if (deletion.deletedCount !== 1) {
        throw new ApiError(404, 'Boutique introuvable.', 'SHOP_NOT_FOUND');
      }
    });
  } finally {
    await session.endSession();
  }

  const storedProducts = products.filter(
    (product): product is typeof product & { imageStorageKey: string } => Boolean(product.imageStorageKey),
  );
  const results = await Promise.allSettled(
    storedProducts.map((product) => deleteProductImage(product.imageStorageKey)),
  );
  results.forEach((result, index) => {
    if (result.status === 'rejected') {
      console.error('Suppression Blob échouée après suppression boutique.', {
        shopId,
        storageKey: storedProducts[index]?.imageStorageKey,
        reason: result.reason instanceof Error ? result.reason.message : 'Erreur inconnue',
      });
    }
  });
}
