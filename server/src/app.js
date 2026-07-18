import cookieParser from 'cookie-parser';
import express from 'express';
import { correlationId } from './middleware/correlationId.js';
import { errorHandler } from './middleware/errorHandler.js';
import { healthRouter } from './routes/health.routes.js';

export function createApp() {
  const app = express();

  app.use(correlationId);
  app.use(express.json({ limit: '1mb' }));
  app.use(cookieParser());

  app.use('/health', healthRouter);

  app.use(errorHandler);

  return app;
}
