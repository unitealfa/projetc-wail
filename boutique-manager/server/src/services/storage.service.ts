import { del, put } from '@vercel/blob';
import { randomUUID } from 'node:crypto';

export interface StoredImage {
  imageUrl: string;
  imageStorageKey: string;
}

const extensions: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

export async function uploadProductImage(
  shopId: string,
  file: Express.Multer.File,
): Promise<StoredImage> {
  const extension = extensions[file.mimetype];
  const pathname = `products/${shopId}/${randomUUID()}.${extension}`;
  const blob = await put(pathname, file.buffer, {
    access: 'public',
    contentType: file.mimetype,
    addRandomSuffix: false,
  });

  return { imageUrl: blob.url, imageStorageKey: blob.pathname };
}

export async function deleteProductImage(storageKey: string): Promise<void> {
  await del(storageKey);
}
