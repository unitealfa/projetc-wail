import type { ErrorRequestHandler } from 'express';
import multer from 'multer';
import { ZodError } from 'zod';
import { ApiError } from '../utils/ApiError.js';

export const errorMiddleware: ErrorRequestHandler = (error, _request, response, _next) => {
  let normalized: ApiError;

  if (error instanceof ApiError) {
    normalized = error;
  } else if (error instanceof multer.MulterError && error.code === 'LIMIT_FILE_SIZE') {
    normalized = new ApiError(413, "L'image dépasse la taille autorisée.", 'IMAGE_TOO_LARGE');
  } else if (error instanceof multer.MulterError) {
    normalized = new ApiError(400, "Téléversement d'image invalide.", 'UPLOAD_ERROR');
  } else if (error instanceof ZodError) {
    normalized = new ApiError(400, 'Données invalides.', 'VALIDATION_ERROR', error.flatten());
  } else if ((error as { name?: string }).name === 'ValidationError') {
    normalized = new ApiError(400, 'Données invalides.', 'VALIDATION_ERROR');
  } else if ((error as { code?: number }).code === 11000) {
    normalized = new ApiError(409, 'Une ressource identique existe déjà.', 'CONFLICT');
  } else {
    normalized = new ApiError(500, 'Erreur interne du serveur.', 'INTERNAL_ERROR');
  }

  if (normalized.statusCode >= 500) {
    console.error('Erreur serveur.', {
      name: error instanceof Error ? error.name : 'UnknownError',
      message: error instanceof Error ? error.message : 'Erreur inconnue',
    });
  }

  response.status(normalized.statusCode).json({
    success: false,
    message: normalized.message,
    code: normalized.code,
    ...(normalized.details !== undefined ? { details: normalized.details } : {}),
  });
};
