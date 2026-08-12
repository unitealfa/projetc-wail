import type { PickedImage, Product, ProductInput } from '../types/product';
import { apiRequest } from './client';

function productFormData(input: ProductInput, image?: PickedImage): FormData {
  const form = new FormData();
  form.append('data', JSON.stringify(input));
  if (image) {
    form.append(
      'image',
      { uri: image.uri, name: image.fileName, type: image.mimeType } as unknown as Blob,
    );
  }
  return form;
}

export const productsApi = {
  list: (shopId: string) =>
    apiRequest<{ products: Product[] }>(`/api/shops/${shopId}/products`),
  get: (shopId: string, productId: string) =>
    apiRequest<{ product: Product }>(`/api/shops/${shopId}/products/${productId}`),
  create: (shopId: string, input: ProductInput, image?: PickedImage) =>
    apiRequest<{ product: Product }>(`/api/shops/${shopId}/products`, {
      method: 'POST',
      formData: productFormData(input, image),
    }),
  update: (shopId: string, productId: string, input: ProductInput, image?: PickedImage) =>
    apiRequest<{ product: Product }>(`/api/shops/${shopId}/products/${productId}`, {
      method: 'PATCH',
      formData: productFormData(input, image),
    }),
  remove: (shopId: string, productId: string) =>
    apiRequest<{ deleted: boolean }>(`/api/shops/${shopId}/products/${productId}`, {
      method: 'DELETE',
    }),
  retryAnalysis: (shopId: string, productId: string) =>
    apiRequest<{ product: Product }>(`/api/shops/${shopId}/products/${productId}/retry-analysis`, {
      method: 'POST',
    }),
};
