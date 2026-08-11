import type { RequestHandler } from 'express';
import { ApiError } from '../utils/ApiError.js';

export const notFoundMiddleware: RequestHandler = (_request, _response, next) => {
  next(new ApiError(404, 'Route introuvable.', 'ROUTE_NOT_FOUND'));
};
