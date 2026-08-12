import type { Types } from 'mongoose';
import { AI_ANALYSIS_STATUS } from '../constants/ai-analysis.js';
import { Product } from '../models/Product.js';
import type { CreateProductInput, UpdateProductInput } from '../schemas/product.schema.js';
import { ApiError } from '../utils/ApiError.js';
import { createProductCode } from '../utils/productCode.js';
import { deleteProductImage, uploadProductImage } from './storage.service.js';
import { analyzeProductImage } from './visual-analysis.service.js';

const MAX_AI_SOURCE_IMAGE_SIZE = 10 * 1024 * 1024;

async function tryUploadProductImage(shopId: string, image?: Express.Multer.File) {
  if (!image) return null;

  try {
    return await uploadProductImage(shopId, image);
  } catch (error) {
    console.error("Upload Blob indisponible, le produit sera enregistré sans image.", {
      name: error instanceof Error ? error.name : 'UnknownError',
    });
    return null;
  }
}

async function analyzeStoredCatalogImage(productId: string, image: Express.Multer.File): Promise<void> {
  try {
    const result = await analyzeProductImage(image.buffer, image.mimetype);
    await Product.updateOne(
      { _id: productId },
      {
        aiVisualProfile: result.profile,
        aiAnalysisStatus: AI_ANALYSIS_STATUS.READY,
        aiAnalysisModel: result.model,
        aiAnalyzedAt: new Date(),
      },
    );
  } catch (error) {
    try {
      await Product.updateOne(
        { _id: productId },
        {
          aiAnalysisStatus: AI_ANALYSIS_STATUS.FAILED,
          aiAnalysisModel: null,
          aiAnalyzedAt: new Date(),
        },
      );
    } catch {
      // Le produit reste créé/modifié même si MongoDB refuse la mise à jour de statut IA.
    }
    console.warn('Analyse IA catalogue non disponible.', {
      productId,
      errorType: error instanceof ApiError ? error.code : 'AI_UNAVAILABLE',
    });
  }
}

export async function createProduct(
  shopId: string,
  userId: Types.ObjectId,
  input: CreateProductInput,
  image?: Express.Multer.File,
) {
  const storedImage = await tryUploadProductImage(shopId, image);
  let product;
  try {
    product = await Product.create({
      ...input,
      shopId,
      ...(storedImage ?? {}),
      aiAnalysisStatus: storedImage ? AI_ANALYSIS_STATUS.PENDING : null,
      internalCode: createProductCode(),
      createdBy: userId,
      updatedBy: userId,
    });
  } catch (error) {
    if (storedImage) {
      try {
        await deleteProductImage(storedImage.imageStorageKey);
      } catch (cleanupError) {
        console.error('Nettoyage du nouveau Blob échoué après erreur MongoDB.', {
          storageKey: storedImage.imageStorageKey,
          reason: cleanupError instanceof Error ? cleanupError.message : 'Erreur inconnue',
        });
      }
    }
    throw error;
  }
  if (storedImage && image) await analyzeStoredCatalogImage(String(product._id), image);
  try {
    return (await Product.findById(product._id)) ?? product;
  } catch {
    return product;
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

  const newImage = await tryUploadProductImage(shopId, image);
  const oldStorageKey = existing.imageStorageKey;

  let updated;
  try {
    updated = await Product.findOneAndUpdate(
      { _id: productId, shopId },
      {
        ...input,
        ...(newImage ?? {}),
        ...(newImage ? {
          aiVisualProfile: null,
          aiAnalysisStatus: AI_ANALYSIS_STATUS.PENDING,
          aiAnalysisModel: null,
          aiAnalyzedAt: null,
        } : {}),
        updatedBy: userId,
      },
      { new: true, runValidators: true },
    );
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
  if (!updated) {
    if (newImage) {
      try { await deleteProductImage(newImage.imageStorageKey); } catch { /* compensation déjà tentée au mieux */ }
    }
    throw new ApiError(404, 'Produit introuvable.', 'PRODUCT_NOT_FOUND');
  }
  if (newImage && oldStorageKey) {
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
  if (newImage && image) await analyzeStoredCatalogImage(productId, image);
  try {
    return (await Product.findById(productId)) ?? updated;
  } catch {
    return updated;
  }
}

async function downloadCatalogImage(imageUrl: string): Promise<{ buffer: Buffer; mimeType: string }> {
  let url: URL;
  try {
    url = new URL(imageUrl);
  } catch {
    throw new ApiError(400, "L'URL de l'image produit est invalide.", 'INVALID_IMAGE_URL');
  }
  if (url.protocol !== 'https:') {
    throw new ApiError(400, "L'URL de l'image produit est invalide.", 'INVALID_IMAGE_URL');
  }
  let response: Response;
  try {
    response = await fetch(url, { signal: AbortSignal.timeout(20_000) });
  } catch {
    throw new ApiError(502, "Impossible de relire l'image du produit.", 'IMAGE_DOWNLOAD_FAILED');
  }
  if (!response.ok) throw new ApiError(502, "Impossible de relire l'image du produit.", 'IMAGE_DOWNLOAD_FAILED');
  const mimeType = response.headers.get('content-type')?.split(';')[0] ?? '';
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(mimeType)) {
    throw new ApiError(400, "Le format de l'image produit n'est pas accepté.", 'INVALID_IMAGE_TYPE');
  }
  const declaredSize = Number(response.headers.get('content-length') ?? 0);
  if (declaredSize > MAX_AI_SOURCE_IMAGE_SIZE) {
    throw new ApiError(413, "L'image est trop volumineuse pour être analysée.", 'IMAGE_TOO_LARGE');
  }
  const buffer = Buffer.from(await response.arrayBuffer());
  if (buffer.length > MAX_AI_SOURCE_IMAGE_SIZE) {
    throw new ApiError(413, "L'image est trop volumineuse pour être analysée.", 'IMAGE_TOO_LARGE');
  }
  return { buffer, mimeType };
}

export async function retryProductAnalysis(
  shopId: string,
  productId: string,
  userId: Types.ObjectId,
) {
  const product = await Product.findOne({ _id: productId, shopId });
  if (!product) throw new ApiError(404, 'Produit introuvable.', 'PRODUCT_NOT_FOUND');
  if (!product.imageUrl) throw new ApiError(400, "Ce produit n'a pas d'image à analyser.", 'PRODUCT_IMAGE_REQUIRED');
  product.aiAnalysisStatus = AI_ANALYSIS_STATUS.PENDING;
  product.updatedBy = userId;
  await product.save();
  try {
    const image = await downloadCatalogImage(product.imageUrl);
    const result = await analyzeProductImage(image.buffer, image.mimeType);
    product.aiVisualProfile = result.profile;
    product.aiAnalysisStatus = AI_ANALYSIS_STATUS.READY;
    product.aiAnalysisModel = result.model;
    product.aiAnalyzedAt = new Date();
    await product.save();
    return product;
  } catch (error) {
    product.aiAnalysisStatus = AI_ANALYSIS_STATUS.FAILED;
    product.aiAnalysisModel = null;
    product.aiAnalyzedAt = new Date();
    await product.save();
    if (error instanceof ApiError) throw error;
    throw new ApiError(503, "Le service d'analyse d'image est temporairement indisponible.", 'AI_UNAVAILABLE');
  }
}

export async function deleteProduct(shopId: string, productId: string): Promise<void> {
  const product = await Product.findOne({ _id: productId, shopId });
  if (!product) {
    throw new ApiError(404, 'Produit introuvable.', 'PRODUCT_NOT_FOUND');
  }
  await product.deleteOne();
  if (product.imageStorageKey) {
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
}
