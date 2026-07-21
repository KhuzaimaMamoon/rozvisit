import cookieParser from 'cookie-parser';
import express from 'express';
import { correlationId } from './middleware/correlationId.js';
import { cors } from './middleware/cors.js';
import { errorHandler } from './middleware/errorHandler.js';
import { apiRouter } from './routes/index.js';
import { healthRouter } from './routes/health.routes.js';

export function createApp() {
  const app = express();

  app.use(correlationId);
  app.use(cors);
  app.use(express.json({ limit: '1mb' }));
  app.use(cookieParser());

  app.use('/health', healthRouter);
  app.use('/api/v1', apiRouter);

  app.use(errorHandler);

  return app;
}
