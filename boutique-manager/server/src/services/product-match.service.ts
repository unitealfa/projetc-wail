import { MATCH_THRESHOLDS, MATCH_WEIGHTS, MATCH_WINDOW, MIN_MATCH_SCORE } from '../constants/matching.js';
import { PRODUCT_TYPES, normalizeProductType } from '../constants/product-types.js';
import type { VisualProductProfile } from '../types/visual-product-profile.js';
import { normalizeColor, normalizeFeatureToken, normalizeString } from '../utils/normalization.js';
import { calculateDistanceKm, type Coordinates } from './distance.service.js';

type Nullable<T> = T | null | undefined;

export interface MatchableShop {
  _id?: unknown;
  id?: string;
  name: string;
  phone: string;
  address: string;
  latitude?: number | null;
  longitude?: number | null;
}

export interface MatchableProduct {
  _id?: unknown;
  id?: string;
  name: string;
  type?: string;
  brand?: string;
  model?: string;
  reference?: string;
  colors?: string[];
  sizes?: string[];
  material?: string;
  stock?: number;
  price?: number;
  currency?: string;
  imageUrl?: string;
  aiVisualProfile?: VisualProductProfile | null;
  shopId: MatchableShop;
}

export type ConfidenceLabel = 'VERY_LIKELY' | 'LIKELY' | 'POSSIBLE';
export type RequestedSizeStatus = 'LISTED' | 'NOT_LISTED' | 'NOT_REQUESTED';

export interface ProductMatch {
  score: number;
  confidenceLabel: ConfidenceLabel;
  reasons: string[];
  product: MatchableProduct;
  shop: MatchableShop;
  distanceKm: number | null;
  requestedSizeStatus: RequestedSizeStatus;
  mustConfirmByPhone: true;
}

interface ScoreAccumulator {
  earned: number;
  possible: number;
  reasons: string[];
}

function addScalar(
  score: ScoreAccumulator,
  queryValue: Nullable<string>,
  candidateValue: Nullable<string>,
  weight: number,
  reason: string,
  normalizer: (value: Nullable<string>) => string | null = normalizeString,
): void {
  const query = normalizer(queryValue);
  const candidate = normalizer(candidateValue);
  if (!query || !candidate) return;
  score.possible += weight;
  if (query === candidate) {
    score.earned += weight;
    score.reasons.push(reason);
    return;
  }
  if (query.includes(candidate) || candidate.includes(query)) score.earned += weight * 0.55;
}

function normalizedSet(values: Nullable<string[]>, normalizer = normalizeFeatureToken): Set<string> {
  return new Set((values ?? []).map((value) => normalizer(value)).filter((value): value is string => Boolean(value)));
}

function addSet(
  score: ScoreAccumulator,
  queryValues: Nullable<string[]>,
  candidateValues: Nullable<string[]>,
  weight: number,
  reason: string,
  normalizer = normalizeFeatureToken,
): void {
  const query = normalizedSet(queryValues, normalizer);
  const candidate = normalizedSet(candidateValues, normalizer);
  if (query.size === 0 || candidate.size === 0) return;
  score.possible += weight;
  let intersection = 0;
  for (const value of query) if (candidate.has(value)) intersection += 1;
  const similarity = intersection / Math.max(query.size, candidate.size);
  score.earned += weight * similarity;
  if (similarity >= 0.34) score.reasons.push(reason);
}

function manualProfile(product: MatchableProduct): VisualProductProfile {
  const normalizedType = normalizeProductType(product.type ?? product.name);
  const color = product.colors?.[0] ?? null;
  const tokens = [product.type, product.brand, product.model, product.reference, color, product.material, product.name]
    .map(normalizeFeatureToken)
    .filter((value): value is string => Boolean(value));
  return {
    schemaVersion: 1,
    isProduct: true,
    multipleProductsDetected: false,
    productFamily: normalizedType === PRODUCT_TYPES.UNKNOWN ? 'unknown' : 'other',
    productType: normalizedType,
    subtype: product.type ?? null,
    brand: product.brand ?? null,
    modelOrLine: product.model ?? product.reference ?? null,
    primaryColor: color,
    secondaryColors: product.colors?.slice(1) ?? [],
    pattern: null,
    materialAppearance: product.material ? [product.material] : [],
    texture: [],
    silhouette: null,
    fit: null,
    necklineOrCollar: null,
    sleeveLength: null,
    closure: null,
    pocketDetails: [],
    logoDetails: [],
    visibleText: [product.brand, product.model, product.reference].filter((value): value is string => Boolean(value)),
    distinctiveFeatures: [],
    styleKeywords: [],
    visualFingerprintTokens: [...new Set(tokens)].slice(0, 12),
    shortDescription: product.name,
    confidence: 0.55,
    fieldConfidence: {
      productType: product.type ? 0.8 : 0.45,
      brand: product.brand ? 0.8 : 0,
      model: product.model || product.reference ? 0.8 : 0,
      color: color ? 0.8 : 0,
      pattern: 0,
    },
  };
}

export function profileForProduct(product: MatchableProduct): VisualProductProfile {
  return product.aiVisualProfile ?? manualProfile(product);
}

export function scoreProductProfile(query: VisualProductProfile, candidate: VisualProductProfile) {
  const score: ScoreAccumulator = { earned: 0, possible: 0, reasons: [] };
  const queryType = normalizeProductType(query.productType);
  const candidateType = normalizeProductType(candidate.productType);
  if (queryType !== PRODUCT_TYPES.UNKNOWN && candidateType !== PRODUCT_TYPES.UNKNOWN) {
    const typeWeight = MATCH_WEIGHTS.productType * Math.min(query.fieldConfidence.productType, candidate.fieldConfidence.productType);
    score.possible += typeWeight;
    if (queryType === candidateType) {
      score.earned += typeWeight;
      score.reasons.push('Même type de produit');
    }
  }
  addScalar(score, query.subtype, candidate.subtype, MATCH_WEIGHTS.subtype, 'Sous-type similaire');
  if (query.fieldConfidence.brand >= 0.55) {
    addScalar(score, query.brand, candidate.brand, MATCH_WEIGHTS.brand * Math.min(query.fieldConfidence.brand, candidate.fieldConfidence.brand), 'Même marque visible');
  }
  if (query.fieldConfidence.model >= 0.55) {
    addScalar(score, query.modelOrLine, candidate.modelOrLine, MATCH_WEIGHTS.referenceOrModel * Math.min(query.fieldConfidence.model, candidate.fieldConfidence.model), 'Même modèle ou référence visible');
  }
  addSet(score, query.visualFingerprintTokens, candidate.visualFingerprintTokens, MATCH_WEIGHTS.fingerprint, 'Détails visuels distinctifs similaires');
  if (query.fieldConfidence.color >= 0.4) {
    const colorWeight = Math.min(query.fieldConfidence.color, candidate.fieldConfidence.color);
    addScalar(score, query.primaryColor, candidate.primaryColor, MATCH_WEIGHTS.primaryColor * colorWeight, 'Même couleur principale', normalizeColor);
    addSet(score, query.secondaryColors, candidate.secondaryColors, MATCH_WEIGHTS.secondaryColors * colorWeight, 'Couleurs secondaires similaires', normalizeColor);
  }
  if (query.fieldConfidence.pattern >= 0.4) {
    addScalar(score, query.pattern, candidate.pattern, MATCH_WEIGHTS.pattern * Math.min(query.fieldConfidence.pattern, candidate.fieldConfidence.pattern), 'Motif similaire');
  }
  addSet(score, query.materialAppearance, candidate.materialAppearance, MATCH_WEIGHTS.material, 'Matière visuelle similaire');
  addSet(score, query.texture, candidate.texture, MATCH_WEIGHTS.texture, 'Texture similaire');
  addScalar(score, query.silhouette, candidate.silhouette, MATCH_WEIGHTS.silhouette, 'Silhouette similaire');
  addScalar(score, query.fit, candidate.fit, MATCH_WEIGHTS.fit, 'Coupe similaire');
  addScalar(score, query.necklineOrCollar, candidate.necklineOrCollar, MATCH_WEIGHTS.neckline, 'Col similaire');
  addScalar(score, query.sleeveLength, candidate.sleeveLength, MATCH_WEIGHTS.sleeve, 'Longueur de manches similaire');
  addScalar(score, query.closure, candidate.closure, MATCH_WEIGHTS.closure, 'Fermeture similaire');
  addSet(score, query.distinctiveFeatures, candidate.distinctiveFeatures, MATCH_WEIGHTS.distinctiveFeatures, 'Caractéristiques distinctives similaires');
  addSet(
    score,
    [...query.visibleText, ...query.logoDetails],
    [...candidate.visibleText, ...candidate.logoDetails],
    MATCH_WEIGHTS.visibleTextAndLogo,
    'Logo ou texte visible similaire',
  );
  const value = score.possible === 0 ? 0 : Math.round((score.earned / score.possible) * 100);
  return { score: Math.max(0, Math.min(100, value)), reasons: [...new Set(score.reasons)].slice(0, 6) };
}

export function confidenceLabel(score: number): ConfidenceLabel {
  if (score >= MATCH_THRESHOLDS.VERY_LIKELY) return 'VERY_LIKELY';
  if (score >= MATCH_THRESHOLDS.LIKELY) return 'LIKELY';
  return 'POSSIBLE';
}

function objectId(value: unknown): string {
  if (typeof value === 'string') return value;
  if (value && typeof value === 'object' && 'toString' in value) return String(value);
  return '';
}

export function findMatchingProducts(
  queryProfile: VisualProductProfile,
  products: MatchableProduct[],
  options: { requestedSize?: string; userCoordinates?: Coordinates } = {},
): ProductMatch[] {
  const scored = products
    .filter((product) => product.stock !== 0 && product.shopId)
    .map((product) => {
      const result = scoreProductProfile(queryProfile, profileForProduct(product));
      const shop = product.shopId;
      const hasShopCoordinates = typeof shop.latitude === 'number' && typeof shop.longitude === 'number';
      const distanceKm = options.userCoordinates && hasShopCoordinates
        ? calculateDistanceKm(options.userCoordinates, { latitude: shop.latitude!, longitude: shop.longitude! })
        : null;
      const normalizedRequestedSize = normalizeString(options.requestedSize);
      const hasSize = normalizedRequestedSize
        ? (product.sizes ?? []).some((size) => normalizeString(size) === normalizedRequestedSize)
        : false;
      const requestedSizeStatus: RequestedSizeStatus = normalizedRequestedSize
        ? (hasSize ? 'LISTED' : 'NOT_LISTED')
        : 'NOT_REQUESTED';
      return {
        ...result,
        confidenceLabel: confidenceLabel(result.score),
        product,
        shop: { ...shop, id: shop.id ?? objectId(shop._id) },
        distanceKm,
        requestedSizeStatus,
        mustConfirmByPhone: true as const,
      };
    });
  const bestScore = Math.max(0, ...scored.map((match) => match.score));
  const selected = scored.filter((match) => match.score >= MIN_MATCH_SCORE && match.score >= bestScore - MATCH_WINDOW);
  return selected.sort((left, right) => {
    if (left.requestedSizeStatus !== right.requestedSizeStatus) {
      if (left.requestedSizeStatus === 'LISTED') return -1;
      if (right.requestedSizeStatus === 'LISTED') return 1;
    }
    if (options.userCoordinates) {
      if (left.distanceKm !== null && right.distanceKm !== null && left.distanceKm !== right.distanceKm) return left.distanceKm - right.distanceKm;
      if (left.distanceKm !== null) return -1;
      if (right.distanceKm !== null) return 1;
    }
    return right.score - left.score;
  });
}
