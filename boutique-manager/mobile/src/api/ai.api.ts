import type { ProductSearchInput, ProductSearchResult } from '../types/productSearch';
import { apiRequest } from './client';

export const aiApi = {
  searchProduct: (input: ProductSearchInput) => {
    const form = new FormData();
    form.append('image', {
      uri: input.image.uri,
      name: input.image.fileName,
      type: input.image.mimeType,
    } as unknown as Blob);
    if (input.size) form.append('size', input.size);
    if (input.latitude !== undefined && input.longitude !== undefined) {
      form.append('latitude', String(input.latitude));
      form.append('longitude', String(input.longitude));
    }
    return apiRequest<ProductSearchResult>('/api/ai/product-search', { method: 'POST', formData: form });
  },
};
