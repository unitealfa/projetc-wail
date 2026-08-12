import { PRODUCT_VISION_PROMPT } from '../constants/product-vision-prompt.js';
import {
  visualProductProfileJsonSchema,
  visualProductProfileSchema,
  type VisualProductProfile,
} from '../schemas/visual-product-profile.schema.js';
import { generateStructuredGemini, type GeminiGenerator } from './gemini.service.js';

interface AnalyzeOptions {
  generator?: GeminiGenerator;
  keys?: string[];
  primaryModel?: string;
  fallbackModel?: string;
}

export async function analyzeProductImage(
  buffer: Buffer,
  mimeType: string,
  options: AnalyzeOptions = {},
): Promise<{ profile: VisualProductProfile; model: string }> {
  return analyzeProductImages([{ buffer, mimeType }], options);
}

export async function analyzeProductImages(
  images: Array<{ buffer: Buffer; mimeType: string }>,
  options: AnalyzeOptions = {},
): Promise<{ profile: VisualProductProfile; model: string }> {
  const result = await generateStructuredGemini({
    prompt: `${PRODUCT_VISION_PROMPT}\n\nLes images fournies montrent le même produit sous un ou deux angles. Fusionne uniquement les informations cohérentes observées sur l'ensemble des images en un seul profil.`,
    images,
    jsonSchema: visualProductProfileJsonSchema,
    validate: (value) => visualProductProfileSchema.parse(value),
    ...options,
  });
  return { profile: result.data, model: result.model };
}
