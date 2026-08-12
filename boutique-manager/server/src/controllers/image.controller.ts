import type { RequestHandler } from 'express';
import { downloadProductImage } from '../services/storage.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { routeParam } from '../utils/objectId.js';

export const getProductImage: RequestHandler = asyncHandler(async (request, response) => {
  const imageId = routeParam(request.params.imageId, 'Image');
  const image = await downloadProductImage(imageId);
  response.set({
    'Cache-Control': 'public, max-age=31536000, immutable',
    'Content-Length': String(image.buffer.length),
    'Content-Type': image.mimeType,
  });
  response.send(image.buffer);
});
