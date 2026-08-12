import type { ProductSearchInput, ProductSearchResult } from '../types/productSearch';
import { apiRequest } from './client';
import { appendPickedImage } from '../utils/formDataImage';

export const aiApi = {
  searchProduct: async (input: ProductSearchInput) => {
    const form = new FormData();
    await appendPickedImage(form, 'image', input.image);
    if (input.size) form.append('size', input.size);
    if (input.latitude !== undefined && input.longitude !== undefined) {
      form.append('latitude', String(input.latitude));
      form.append('longitude', String(input.longitude));
    }
    return apiRequest<ProductSearchResult>('/api/ai/product-search', { method: 'POST', formData: form });
  },
};
