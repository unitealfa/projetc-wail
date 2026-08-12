import type { RequestHandler } from 'express';
import { MIN_ANALYSIS_CONFIDENCE } from '../constants/matching.js';
import { Product } from '../models/Product.js';
import { productSearchSchema } from '../schemas/ai-search.schema.js';
import { analyzeProductImage } from '../services/visual-analysis.service.js';
import { findMatchingProducts, type MatchableProduct } from '../services/product-match.service.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

function publicProduct(match: ReturnType<typeof findMatchingProducts>[number]) {
  const product = match.product;
  return {
    score: match.score,
    confidenceLabel: match.confidenceLabel,
    reasons: match.reasons,
    product: {
      id: String(product._id ?? product.id ?? ''),
      name: product.name,
      brand: product.brand ?? null,
      type: product.type ?? null,
      model: product.model ?? null,
      reference: product.reference ?? null,
      colors: product.colors ?? [],
      sizes: product.sizes ?? [],
      stock: product.stock ?? null,
      price: product.price ?? null,
      currency: product.currency ?? null,
      imageUrl: product.imageUrl ?? null,
    },
    shop: {
      id: match.shop.id ?? String(match.shop._id ?? ''),
      name: match.shop.name,
      phone: match.shop.phone,
      address: match.shop.address,
      latitude: match.shop.latitude ?? null,
      longitude: match.shop.longitude ?? null,
    },
    distanceKm: match.distanceKm,
    requestedSizeStatus: match.requestedSizeStatus,
    mustConfirmByPhone: true,
  };
}

export const searchProductByImage: RequestHandler = asyncHandler(async (request, response) => {
  if (!request.file) throw new ApiError(400, "L'image est obligatoire.", 'MISSING_IMAGE');
  const input = productSearchSchema.parse(request.body);
  const analysisResult = await analyzeProductImage(request.file.buffer, request.file.mimetype);
  const analysis = analysisResult.profile;
  if (!analysis.isProduct || analysis.confidence < MIN_ANALYSIS_CONFIDENCE) {
    response.json({
      success: true,
      data: {
        analysis,
        lowConfidence: true,
        message: "L'image ne permet pas d'identifier clairement un produit.",
        matches: [],
      },
    });
    return;
  }

  const products = await Product.find({ stock: { $ne: 0 } })
    .populate('shopId')
    .limit(2500)
    .lean();
  const candidates = products.filter((product) => product.shopId && typeof product.shopId === 'object') as unknown as MatchableProduct[];
  const matches = findMatchingProducts(analysis, candidates, {
    requestedSize: input.size,
    userCoordinates: input.latitude !== undefined && input.longitude !== undefined
      ? { latitude: input.latitude, longitude: input.longitude }
      : undefined,
  });
  response.json({
    success: true,
    data: {
      analysis,
      lowConfidence: false,
      multipleStrongMatches: matches.filter((match) => match.score >= 85).length > 1,
      matches: matches.map(publicProduct),
    },
  });
});
