import { z } from 'zod';
import { visualProductProfileSchema } from './visual-product-profile.schema.js';

export const precomputedProductAnalysisSchema = z.object({
  profile: visualProductProfileSchema,
  model: z.string().trim().min(1).max(200),
});

export type PrecomputedProductAnalysis = z.infer<typeof precomputedProductAnalysisSchema>;
