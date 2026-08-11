import { z } from 'zod';

const optionalText = (maximum: number) =>
  z
    .string()
    .trim()
    .max(maximum)
    .optional()
    .transform((value) => value || undefined);

const productFields = z.object({
  name: z.string().trim().min(2).max(120),
  type: z.string().trim().min(1).max(60),
  brand: z.string().trim().min(1).max(80),
  model: optionalText(120),
  reference: optionalText(120),
  sku: optionalText(120),
  barcode: optionalText(120),
  colors: z.array(z.string().trim().min(1).max(60)).min(1),
  sizes: z.array(z.string().trim().min(1).max(60)).default([]),
  material: optionalText(120),
  targetAudience: optionalText(120),
  description: optionalText(2000),
  price: z.number().finite().min(0).optional(),
  currency: optionalText(12),
  stock: z.number().int().min(0).optional(),
  customAttributes: z
    .array(
      z.object({
        key: z.string().trim().min(1).max(100),
        value: z.string().trim().min(1).max(250),
      }),
    )
    .default([]),
});

export const createProductSchema = productFields;
export const updateProductSchema = productFields.partial();

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
