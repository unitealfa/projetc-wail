import mongoose from 'mongoose';
import { ApiError } from './ApiError.js';

export function assertObjectId(value: string, label: string): void {
  if (!mongoose.isObjectIdOrHexString(value)) {
    throw new ApiError(400, `${label} invalide.`, 'INVALID_OBJECT_ID');
  }
}

export function routeParam(value: string | string[], label: string): string {
  if (Array.isArray(value) || !value) {
    throw new ApiError(400, `${label} invalide.`, 'INVALID_ROUTE_PARAMETER');
  }
  return value;
}
