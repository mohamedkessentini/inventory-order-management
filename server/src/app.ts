import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { env } from './config/env';
import { authRouter } from './routes/auth.routes';
import { supplierRouter } from './routes/supplier.routes';
import { productRouter } from './routes/product.routes';
import { purchaseOrderRouter } from './routes/purchaseOrder.routes';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';

export function createApp(): Express {
  const app = express();

  app.use(helmet());
  app.use(cors({ origin: env.corsOrigin, credentials: true }));
  app.use(express.json());
  if (env.nodeEnv !== 'test') {
    app.use(morgan(env.nodeEnv === 'production' ? 'combined' : 'dev'));
  }

  app.get('/health', (_req, res) => {
    res.status(200).json({ status: 'UP' });
  });

  app.use('/api/auth', authRouter);
  app.use('/api/suppliers', supplierRouter);
  app.use('/api/products', productRouter);
  app.use('/api/purchase-orders', purchaseOrderRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
