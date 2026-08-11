import type { Shop, ShopInput } from '../types/shop';
import type { User } from '../types/user';
import { apiRequest } from './client';

export const shopsApi = {
  create: (input: ShopInput) =>
    apiRequest<{ shop: Shop; user: User }>('/api/shops', { method: 'POST', json: input }),
  remove: (shopId: string) =>
    apiRequest<{ deleted: boolean }>(`/api/shops/${shopId}`, { method: 'DELETE' }),
};
