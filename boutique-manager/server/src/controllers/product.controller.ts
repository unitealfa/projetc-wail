import type { RequestHandler } from 'express';
import { Product } from '../models/Product.js';
import { createProductSchema, updateProductSchema } from '../schemas/product.schema.js';
import {
  createProduct as createProductService,
  deleteProduct as deleteProductService,
  updateProduct as updateProductService,
} from '../services/product.service.js';
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
  if (!request.file) {
    throw new ApiError(400, "L'image du produit est obligatoire.", 'IMAGE_REQUIRED');
  }
  const input = createProductSchema.parse(parseMultipartData(request.body.data));
  const shopId = routeParam(request.params.shopId, 'Boutique');
  const product = await createProductService(shopId, request.user!._id, input, request.file);
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
    request.file,
  );
  response.json({ success: true, data: { product } });
});

export const deleteProduct: RequestHandler = asyncHandler(async (request, response) => {
  const shopId = routeParam(request.params.shopId, 'Boutique');
  const productId = routeParam(request.params.productId, 'Produit');
  assertObjectId(productId, 'Produit');
  await deleteProductService(shopId, productId);
  response.json({ success: true, data: { deleted: true } });
});
