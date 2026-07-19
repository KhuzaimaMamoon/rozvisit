import { Router } from 'express';
import { listPlans } from '../controllers/subscriptions.controller.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { requireRole } from '../middleware/requireRole.js';

export const plansRouter = Router();

plansRouter.use(requireAuth);
plansRouter.get('/', requireRole('client'), listPlans);
