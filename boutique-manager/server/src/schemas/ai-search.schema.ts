import { z } from 'zod';

const optionalCoordinate = (minimum: number, maximum: number) => z.preprocess(
  (value) => value === '' || value === undefined ? undefined : Number(value),
  z.number().finite().min(minimum).max(maximum).optional(),
);

export const productSearchSchema = z.object({
  size: z.string().trim().max(30).optional().transform((value) => value || undefined),
  latitude: optionalCoordinate(-90, 90),
  longitude: optionalCoordinate(-180, 180),
}).refine(
  (value) => (value.latitude === undefined) === (value.longitude === undefined),
  { message: 'Latitude et longitude doivent être envoyées ensemble.' },
);
