import { randomUUID } from 'node:crypto';
import mongoose from 'mongoose';
import { ApiError } from '../utils/ApiError.js';

export interface StoredImage {
  imageUrl: string;
  imageStorageKey: string;
}

export interface DownloadedImage {
  buffer: Buffer;
  mimeType: string;
}

const BUCKET_NAME = 'product_images';
const extensions: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

function imageBucket(): InstanceType<typeof mongoose.mongo.GridFSBucket> {
  const database = mongoose.connection.db;
  if (!database) {
    throw new ApiError(503, "La base d'images n'est pas connectée.", 'IMAGE_STORAGE_UNAVAILABLE');
  }
  return new mongoose.mongo.GridFSBucket(database, { bucketName: BUCKET_NAME });
}

function imageObjectId(storageKey: string): InstanceType<typeof mongoose.mongo.ObjectId> | null {
  if (!/^[a-f\d]{24}$/i.test(storageKey)) return null;
  return new mongoose.mongo.ObjectId(storageKey);
}

export async function uploadProductImage(
  shopId: string,
  file: Express.Multer.File,
): Promise<StoredImage> {
  const extension = extensions[file.mimetype];
  if (!extension) {
    throw new ApiError(400, 'Format image non accepté (JPEG, PNG ou WEBP).', 'INVALID_IMAGE_TYPE');
  }

  const upload = imageBucket().openUploadStream(`${randomUUID()}.${extension}`, {
    metadata: {
      shopId,
      originalName: file.originalname,
      mimeType: file.mimetype,
    },
  });

  return await new Promise<StoredImage>((resolve, reject) => {
    upload.once('error', reject);
    upload.once('finish', () => {
      const imageStorageKey = String(upload.id);
      resolve({
        imageUrl: `/api/images/${imageStorageKey}`,
        imageStorageKey,
      });
    });
    upload.end(file.buffer);
  });
}

export async function downloadProductImage(storageKey: string): Promise<DownloadedImage> {
  const objectId = imageObjectId(storageKey);
  if (!objectId) {
    throw new ApiError(404, 'Image introuvable.', 'IMAGE_NOT_FOUND');
  }

  const bucket = imageBucket();
  const file = await bucket.find({ _id: objectId }).next();
  if (!file) {
    throw new ApiError(404, 'Image introuvable.', 'IMAGE_NOT_FOUND');
  }

  const chunks: Buffer[] = [];
  const download = bucket.openDownloadStream(objectId);
  try {
    for await (const chunk of download) chunks.push(Buffer.from(chunk));
  } catch {
    throw new ApiError(500, "Impossible de lire le fichier image.", 'IMAGE_READ_FAILED');
  }

  const metadata = file.metadata as { mimeType?: unknown } | undefined;
  const mimeType = typeof metadata?.mimeType === 'string'
    ? metadata.mimeType
    : 'application/octet-stream';
  return { buffer: Buffer.concat(chunks), mimeType };
}

export async function deleteProductImage(storageKey: string): Promise<void> {
  const objectId = imageObjectId(storageKey);
  // Les anciennes clés éventuelles appartenaient à Vercel Blob. Elles ne doivent
  // pas provoquer l'échec d'une suppression après la migration vers GridFS.
  if (!objectId) return;

  try {
    await imageBucket().delete(objectId);
  } catch (error) {
    if (
      (error as { code?: string }).code === 'ENOENT'
      || (error instanceof Error && error.message.startsWith('File not found for id '))
    ) return;
    throw error;
  }
}
