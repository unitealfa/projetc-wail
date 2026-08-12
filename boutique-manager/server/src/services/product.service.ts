import type { Types } from 'mongoose';
import { AI_ANALYSIS_STATUS } from '../constants/ai-analysis.js';
import { Product } from '../models/Product.js';
import type { CreateProductInput, UpdateProductInput } from '../schemas/product.schema.js';
import type { PrecomputedProductAnalysis } from '../schemas/product-autofill.schema.js';
import { ApiError } from '../utils/ApiError.js';
import { createProductCode } from '../utils/productCode.js';
import { deleteProductImage, uploadProductImage } from './storage.service.js';
import { analyzeProductImages } from './visual-analysis.service.js';
import type { StoredImage } from './storage.service.js';

const MAX_AI_SOURCE_IMAGE_SIZE = 10 * 1024 * 1024;

export async function uploadRequiredProductImages(
  shopId: string,
  images: Express.Multer.File[],
  upload: typeof uploadProductImage = uploadProductImage,
  cleanup: typeof deleteProductImage = deleteProductImage,
): Promise<StoredImage[]> {
  const stored: StoredImage[] = [];
  for (const image of images.slice(0, 2)) {
    try {
      stored.push(await upload(shopId, image));
    } catch (error) {
      await Promise.allSettled(stored.map((item) => cleanup(item.imageStorageKey)));
      console.error("Upload Blob du produit impossible.", {
        errorType: error instanceof Error ? error.name : 'UnknownError',
        hasOidcToken: Boolean(process.env.VERCEL_OIDC_TOKEN),
        hasStoreId: Boolean(process.env.BLOB_STORE_ID),
      });
      throw new ApiError(
        503,
        "L'image n'a pas pu être enregistrée. Vérifiez que le Blob Store Vercel est connecté au projet puis réessayez.",
        'PRODUCT_IMAGE_UPLOAD_FAILED',
      );
    }
  }
  return stored;
}

async function analyzeStoredCatalogImages(
  productId: string,
  images: Express.Multer.File[],
  precomputed?: PrecomputedProductAnalysis,
): Promise<void> {
  try {
    const result = precomputed ?? await analyzeProductImages(
      images.map((image) => ({ buffer: image.buffer, mimeType: image.mimetype })),
    );
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
  images: Express.Multer.File[] = [],
  precomputedAnalysis?: PrecomputedProductAnalysis,
) {
  const storedImages = await uploadRequiredProductImages(shopId, images);
  if (images.length > 0 && storedImages.length !== images.slice(0, 2).length) {
    throw new ApiError(503, "Toutes les images n'ont pas pu être enregistrées.", 'PRODUCT_IMAGE_UPLOAD_FAILED');
  }
  const imageUrls = storedImages.map((image) => image.imageUrl);
  const imageStorageKeys = storedImages.map((image) => image.imageStorageKey);
  let product;
  try {
    product = await Product.create({
      ...input,
      shopId,
      imageUrl: imageUrls[0],
      imageStorageKey: imageStorageKeys[0],
      imageUrls,
      imageStorageKeys,
      aiAnalysisStatus: images.length ? AI_ANALYSIS_STATUS.PENDING : null,
      internalCode: createProductCode(),
      createdBy: userId,
      updatedBy: userId,
    });
  } catch (error) {
    await Promise.allSettled(imageStorageKeys.map(deleteProductImage));
    throw error;
  }
  if (images.length) await analyzeStoredCatalogImages(String(product._id), images, precomputedAnalysis);
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
  images: Express.Multer.File[] = [],
  precomputedAnalysis?: PrecomputedProductAnalysis,
  retainedImageUrls?: string[],
) {
  const existing = await Product.findOne({ _id: productId, shopId });
  if (!existing) {
    throw new ApiError(404, 'Produit introuvable.', 'PRODUCT_NOT_FOUND');
  }

  const existingUrls: string[] = existing.imageUrls.length ? existing.imageUrls : (existing.imageUrl ? [existing.imageUrl] : []);
  const existingKeys: string[] = existing.imageStorageKeys.length ? existing.imageStorageKeys : (existing.imageStorageKey ? [existing.imageStorageKey] : []);
  const existingPairs = existingUrls.map((url, index) => ({ url, key: existingKeys[index] }));
  const retainedSet = retainedImageUrls ? new Set(retainedImageUrls) : null;
  const retained = retainedSet ? existingPairs.filter((image) => retainedSet.has(image.url)) : existingPairs;
  if (retained.length + images.length > 2) {
    throw new ApiError(400, 'Deux images maximum par produit.', 'TOO_MANY_IMAGES');
  }
  const storedImages = await uploadRequiredProductImages(shopId, images);
  if (images.length > 0 && storedImages.length !== images.slice(0, 2).length) {
    throw new ApiError(503, "Toutes les images n'ont pas pu être enregistrées.", 'PRODUCT_IMAGE_UPLOAD_FAILED');
  }
  const finalUrls = [...retained.map((image) => image.url), ...storedImages.map((image) => image.imageUrl)];
  const finalKeys = [...retained.map((image) => image.key).filter((key): key is string => Boolean(key)), ...storedImages.map((image) => image.imageStorageKey)];
  const removedKeys = existingPairs
    .filter((image) => !retained.some((kept) => kept.url === image.url))
    .map((image) => image.key)
    .filter((key): key is string => Boolean(key));

  let updated;
  try {
    const updateFields = {
      ...input,
      imageUrls: finalUrls,
      imageStorageKeys: finalKeys,
      ...(finalUrls[0] ? { imageUrl: finalUrls[0] } : {}),
      ...(finalKeys[0] ? { imageStorageKey: finalKeys[0] } : {}),
      ...(images.length ? {
        aiVisualProfile: null,
        aiAnalysisStatus: AI_ANALYSIS_STATUS.PENDING,
        aiAnalysisModel: null,
        aiAnalyzedAt: null,
      } : finalUrls.length === 0 ? {
        aiVisualProfile: null,
        aiAnalysisStatus: null,
        aiAnalysisModel: null,
        aiAnalyzedAt: null,
      } : {}),
      updatedBy: userId,
    };
    updated = await Product.findOneAndUpdate(
      { _id: productId, shopId },
      {
        $set: updateFields,
        ...(!finalUrls[0] || !finalKeys[0] ? {
          $unset: {
            ...(!finalUrls[0] ? { imageUrl: 1 } : {}),
            ...(!finalKeys[0] ? { imageStorageKey: 1 } : {}),
          },
        } : {}),
      },
      { new: true, runValidators: true },
    );
  } catch (error) {
    await Promise.allSettled(storedImages.map((image) => deleteProductImage(image.imageStorageKey)));
    throw error;
  }
  if (!updated) {
    await Promise.allSettled(storedImages.map((image) => deleteProductImage(image.imageStorageKey)));
    throw new ApiError(404, 'Produit introuvable.', 'PRODUCT_NOT_FOUND');
  }
  await Promise.allSettled(removedKeys.map(deleteProductImage));
  if (images.length) await analyzeStoredCatalogImages(productId, images, precomputedAnalysis);
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
  const imageUrls = product.imageUrls.length ? product.imageUrls : (product.imageUrl ? [product.imageUrl] : []);
  if (!imageUrls.length) throw new ApiError(400, "Ce produit n'a pas d'image à analyser.", 'PRODUCT_IMAGE_REQUIRED');
  product.aiAnalysisStatus = AI_ANALYSIS_STATUS.PENDING;
  product.updatedBy = userId;
  await product.save();
  try {
    const images = await Promise.all(imageUrls.slice(0, 2).map(downloadCatalogImage));
    const result = await analyzeProductImages(images);
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
  const storageKeys: string[] = product.imageStorageKeys.length
    ? product.imageStorageKeys
    : (product.imageStorageKey ? [product.imageStorageKey] : []);
  const results = await Promise.allSettled([...new Set(storageKeys)].map(deleteProductImage));
  if (results.some((result) => result.status === 'rejected')) {
    console.error('Suppression de certaines images Blob échouée après suppression produit.', { productId });
  }
}
