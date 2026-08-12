export const MATCH_WEIGHTS = {
  referenceOrModel: 24,
  brand: 14,
  productType: 20,
  subtype: 8,
  fingerprint: 24,
  primaryColor: 10,
  secondaryColors: 4,
  pattern: 7,
  material: 6,
  texture: 10,
  silhouette: 6,
  fit: 8,
  neckline: 6,
  sleeve: 4,
  closure: 5,
  distinctiveFeatures: 15,
  visibleTextAndLogo: 13,
} as const;

export const MIN_MATCH_SCORE = 55;
export const MATCH_WINDOW = 8;
export const MIN_ANALYSIS_CONFIDENCE = 0.45;

export const MATCH_THRESHOLDS = {
  VERY_LIKELY: 85,
  LIKELY: 70,
  POSSIBLE: MIN_MATCH_SCORE,
} as const;
