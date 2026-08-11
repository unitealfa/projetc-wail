import cors from 'cors';
import express from 'express';
import { databaseMiddleware } from './middleware/database.middleware.js';
import { errorMiddleware } from './middleware/error.middleware.js';
import { notFoundMiddleware } from './middleware/notFound.middleware.js';
import { authRouter } from './routes/auth.routes.js';
import { productRouter } from './routes/product.routes.js';
import { shopRouter } from './routes/shop.routes.js';
import { userRouter } from './routes/user.routes.js';

export const app = express();

app.disable('x-powered-by');
app.use(cors());
app.use(express.json({ limit: '1mb' }));

app.get('/', (_request, response) => {
  response.json({
    success: true,
    data: {
      status: 'ok',
      service: 'Boutique Manager API',
      health: '/api/health',
    },
  });
});

app.get('/favicon.ico', (_request, response) => {
  response.status(204).end();
});

app.get('/api/health', (_request, response) => {
  response.json({ success: true, data: { status: 'ok' } });
});

app.use('/api', databaseMiddleware);
app.use('/api/auth', authRouter);
app.use('/api/users', userRouter);
app.use('/api/shops', shopRouter);
app.use('/api/shops/:shopId/products', productRouter);
app.use(notFoundMiddleware);
app.use(errorMiddleware);

export default app;
