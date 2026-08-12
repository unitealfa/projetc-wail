import type { Request, RequestHandler } from 'express';
import { Product } from '../models/Product.js';
import { createProductSchema, updateProductSchema } from '../schemas/product.schema.js';
import { precomputedProductAnalysisSchema } from '../schemas/product-autofill.schema.js';
import {
  createProduct as createProductService,
  deleteProduct as deleteProductService,
  retryProductAnalysis as retryProductAnalysisService,
  updateProduct as updateProductService,
} from '../services/product.service.js';
import { productSuggestionsFromProfile } from '../services/product-autofill.service.js';
import { analyzeProductImages } from '../services/visual-analysis.service.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { assertObjectId, routeParam } from '../utils/objectId.js';

function parseMultipartData(raw: unknown): unknown {
  if (typeof raw !== 'string') {
    throw new ApiError(400, 'Le champ multipart data est obligatoire.', 'MISSING_PRODUCT_DATA');
  }
  try {
    return JSON.parse(raw);
  } catch {
    throw new ApiError(400, 'Le champ data contient un JSON invalide.', 'INVALID_PRODUCT_DATA');
  }
}

function uploadedProductImages(request: Request): Express.Multer.File[] {
  if (Array.isArray(request.files)) return request.files;
  const grouped = request.files as Record<string, Express.Multer.File[]> | undefined;
  return [...(grouped?.images ?? []), ...(grouped?.image ?? [])].slice(0, 2);
}

function parseRetainedImageUrls(raw: unknown): string[] | undefined {
  if (typeof raw !== 'string' || !raw.trim()) return undefined;
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length > 2 || parsed.some((value) => typeof value !== 'string')) throw new Error();
    return parsed;
  } catch {
    throw new ApiError(400, 'Liste des images conservées invalide.', 'INVALID_RETAINED_IMAGES');
  }
}

function parsePrecomputedAnalysis(raw: unknown) {
  if (typeof raw !== 'string' || !raw.trim()) return undefined;
  try {
    return precomputedProductAnalysisSchema.parse(JSON.parse(raw));
  } catch {
    throw new ApiError(400, 'Analyse IA préremplie invalide.', 'INVALID_AI_ANALYSIS');
  }
}

export const listProducts: RequestHandler = asyncHandler(async (request, response) => {
  const shopId = routeParam(request.params.shopId, 'Boutique');
  const products = await Product.find({ shopId }).sort({ createdAt: -1 });
  response.json({ success: true, data: { products } });
});

export const getProduct: RequestHandler = asyncHandler(async (request, response) => {
  const shopId = routeParam(request.params.shopId, 'Boutique');
  const productId = routeParam(request.params.productId, 'Produit');
  assertObjectId(productId, 'Produit');
  const product = await Product.findOne({ _id: productId, shopId });
  if (!product) {
    throw new ApiError(404, 'Produit introuvable.', 'PRODUCT_NOT_FOUND');
  }
  response.json({ success: true, data: { product } });
});

export const createProduct: RequestHandler = asyncHandler(async (request, response) => {
  const input = createProductSchema.parse(parseMultipartData(request.body.data));
  const shopId = routeParam(request.params.shopId, 'Boutique');
  const product = await createProductService(
    shopId,
    request.user!._id,
    input,
    uploadedProductImages(request),
    parsePrecomputedAnalysis(request.body.aiAnalysis),
  );
  response.status(201).json({ success: true, data: { product } });
});

export const updateProduct: RequestHandler = asyncHandler(async (request, response) => {
  const shopId = routeParam(request.params.shopId, 'Boutique');
  const productId = routeParam(request.params.productId, 'Produit');
  assertObjectId(productId, 'Produit');
  const input = updateProductSchema.parse(parseMultipartData(request.body.data));
  const product = await updateProductService(
    shopId,
    productId,
    request.user!._id,
    input,
    uploadedProductImages(request),
    parsePrecomputedAnalysis(request.body.aiAnalysis),
    parseRetainedImageUrls(request.body.retainedImageUrls),
  );
  response.json({ success: true, data: { product } });
});

export const autofillProductFromImages: RequestHandler = asyncHandler(async (request, response) => {
  const images = uploadedProductImages(request);
  if (images.length === 0) throw new ApiError(400, 'Ajoutez au moins une image.', 'MISSING_IMAGE');
  const result = await analyzeProductImages(images.map((image) => ({ buffer: image.buffer, mimeType: image.mimetype })));
  if (!result.profile.isProduct || result.profile.confidence < 0.45) {
    throw new ApiError(422, "L'IA ne reconnaît pas clairement un produit sur ces images.", 'PRODUCT_NOT_RECOGNIZED');
  }
  response.json({
    success: true,
    data: {
      suggestions: productSuggestionsFromProfile(result.profile),
      analysis: result,
    },
  });
});

export const deleteProduct: RequestHandler = asyncHandler(async (request, response) => {
  const shopId = routeParam(request.params.shopId, 'Boutique');
  const productId = routeParam(request.params.productId, 'Produit');
  assertObjectId(productId, 'Produit');
  await deleteProductService(shopId, productId);
  response.json({ success: true, data: { deleted: true } });
});

export const retryProductAnalysis: RequestHandler = asyncHandler(async (request, response) => {
  const shopId = routeParam(request.params.shopId, 'Boutique');
  const productId = routeParam(request.params.productId, 'Produit');
  assertObjectId(productId, 'Produit');
  const product = await retryProductAnalysisService(shopId, productId, request.user!._id);
  response.json({ success: true, data: { product } });
});
