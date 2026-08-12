import { z } from 'zod';

const shopFields = z.object({
  name: z.string().trim().min(1, 'Le nom est obligatoire.').max(120),
  phone: z.string().trim().min(1, 'Le téléphone est obligatoire.').max(40),
  address: z.string().trim().min(1, "L'adresse est obligatoire.").max(250),
  latitude: z.number().min(-90).max(90).nullable().optional(),
  longitude: z.number().min(-180).max(180).nullable().optional(),
}).refine(
  (value) => (value.latitude == null) === (value.longitude == null),
  { message: 'Latitude et longitude doivent être renseignées ensemble.' },
);

export const createShopSchema = shopFields;
export const updateShopSchema = shopFields;

export type CreateShopInput = z.infer<typeof createShopSchema>;
export type UpdateShopInput = z.infer<typeof updateShopSchema>;
