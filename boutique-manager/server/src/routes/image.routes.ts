import { Router } from 'express';
import { getProductImage } from '../controllers/image.controller.js';

export const imageRouter = Router();
imageRouter.get('/:imageId', getProductImage);
