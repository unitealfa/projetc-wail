import type { Types } from 'mongoose';
import { Product } from '../models/Product.js';
import type { CreateProductInput, UpdateProductInput } from '../schemas/product.schema.js';
import { ApiError } from '../utils/ApiError.js';
import { createProductCode } from '../utils/productCode.js';
import { deleteProductImage, uploadProductImage } from './storage.service.js';

export async function createProduct(
  shopId: string,
  userId: Types.ObjectId,
  input: CreateProductInput,
  image: Express.Multer.File,
) {
  const storedImage = await uploadProductImage(shopId, image);
  try {
    return await Product.create({
      ...input,
      shopId,
      ...storedImage,
      internalCode: createProductCode(),
      createdBy: userId,
      updatedBy: userId,
    });
  } catch (error) {
    try {
      await deleteProductImage(storedImage.imageStorageKey);
    } catch (cleanupError) {
      console.error('Nettoyage du nouveau Blob échoué après erreur MongoDB.', {
        storageKey: storedImage.imageStorageKey,
        reason: cleanupError instanceof Error ? cleanupError.message : 'Erreur inconnue',
      });
    }
    throw error;
  }
}

export async function updateProduct(
  shopId: string,
  productId: string,
  userId: Types.ObjectId,
  input: UpdateProductInput,
  image?: Express.Multer.File,
) {
  const existing = await Product.findOne({ _id: productId, shopId });
  if (!existing) {
    throw new ApiError(404, 'Produit introuvable.', 'PRODUCT_NOT_FOUND');
  }

  const newImage = image ? await uploadProductImage(shopId, image) : null;
  const oldStorageKey = existing.imageStorageKey;

  try {
    const updated = await Product.findOneAndUpdate(
      { _id: productId, shopId },
      { ...input, ...(newImage ?? {}), updatedBy: userId },
      { new: true, runValidators: true },
    );
    if (!updated) {
      throw new ApiError(404, 'Produit introuvable.', 'PRODUCT_NOT_FOUND');
    }

    if (newImage) {
      try {
        await deleteProductImage(oldStorageKey);
      } catch (error) {
        console.error("Suppression de l'ancien Blob échouée après mise à jour produit.", {
          productId,
          storageKey: oldStorageKey,
          reason: error instanceof Error ? error.message : 'Erreur inconnue',
        });
      }
    }
    return updated;
  } catch (error) {
    if (newImage) {
      try {
        await deleteProductImage(newImage.imageStorageKey);
      } catch (cleanupError) {
        console.error('Nettoyage du nouveau Blob échoué après erreur MongoDB.', {
          storageKey: newImage.imageStorageKey,
          reason: cleanupError instanceof Error ? cleanupError.message : 'Erreur inconnue',
        });
      }
    }
    throw error;
  }
}

export async function deleteProduct(shopId: string, productId: string): Promise<void> {
  const product = await Product.findOne({ _id: productId, shopId });
  if (!product) {
    throw new ApiError(404, 'Produit introuvable.', 'PRODUCT_NOT_FOUND');
  }
  await product.deleteOne();
  try {
    await deleteProductImage(product.imageStorageKey);
  } catch (error) {
    console.error('Suppression Blob échouée après suppression produit.', {
      productId,
      storageKey: product.imageStorageKey,
      reason: error instanceof Error ? error.message : 'Erreur inconnue',
    });
  }
}
