import { z } from 'zod';

export const createShopSchema = z.object({
  name: z.string().trim().min(1, 'Le nom est obligatoire.').max(120),
  phone: z.string().trim().min(1, 'Le téléphone est obligatoire.').max(40),
  address: z.string().trim().min(1, "L'adresse est obligatoire.").max(250),
});

export type CreateShopInput = z.infer<typeof createShopSchema>;
