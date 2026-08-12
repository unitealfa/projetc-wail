import type { PickedImage, Product, ProductAiAnalysis, ProductAutofillSuggestions, ProductInput } from '../types/product';
import { appendPickedImage } from '../utils/formDataImage';
import { apiRequest } from './client';

async function productFormData(
  input: ProductInput,
  images: PickedImage[] = [],
  aiAnalysis?: ProductAiAnalysis,
  retainedImageUrls?: string[],
): Promise<FormData> {
  const form = new FormData();
  form.append('data', JSON.stringify(input));
  if (aiAnalysis) form.append('aiAnalysis', JSON.stringify(aiAnalysis));
  if (retainedImageUrls) form.append('retainedImageUrls', JSON.stringify(retainedImageUrls));
  for (const image of images.slice(0, 2)) await appendPickedImage(form, 'images', image);
  return form;
}

export const productsApi = {
  list: (shopId: string) =>
    apiRequest<{ products: Product[] }>(`/api/shops/${shopId}/products`),
  get: (shopId: string, productId: string) =>
    apiRequest<{ product: Product }>(`/api/shops/${shopId}/products/${productId}`),
  create: async (shopId: string, input: ProductInput, images?: PickedImage[], aiAnalysis?: ProductAiAnalysis) =>
    apiRequest<{ product: Product }>(`/api/shops/${shopId}/products`, {
      method: 'POST',
      formData: await productFormData(input, images, aiAnalysis),
    }),
  update: async (shopId: string, productId: string, input: ProductInput, images?: PickedImage[], aiAnalysis?: ProductAiAnalysis, retainedImageUrls?: string[]) =>
    apiRequest<{ product: Product }>(`/api/shops/${shopId}/products/${productId}`, {
      method: 'PATCH',
      formData: await productFormData(input, images, aiAnalysis, retainedImageUrls),
    }),
  autofill: async (shopId: string, images: PickedImage[]) => {
    const form = new FormData();
    for (const image of images.slice(0, 2)) await appendPickedImage(form, 'images', image);
    return apiRequest<{ suggestions: ProductAutofillSuggestions; analysis: ProductAiAnalysis }>(`/api/shops/${shopId}/products/autofill`, {
      method: 'POST',
      formData: form,
    });
  },
  remove: (shopId: string, productId: string) =>
    apiRequest<{ deleted: boolean }>(`/api/shops/${shopId}/products/${productId}`, {
      method: 'DELETE',
    }),
  retryAnalysis: (shopId: string, productId: string) =>
    apiRequest<{ product: Product }>(`/api/shops/${shopId}/products/${productId}/retry-analysis`, {
      method: 'POST',
    }),
};
