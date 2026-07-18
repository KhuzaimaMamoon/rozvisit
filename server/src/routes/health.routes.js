import express from 'express';
import mongoose from 'mongoose';
import { respond } from '../utils/respond.js';

export const healthRouter = express.Router();

healthRouter.get('/', (req, res) => {
  const dbState = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  return respond.ok(res, { status: 'ok', db: dbState });
});
