import { Router } from 'express';
import {
  cancelSubscription,
  getSubscription,
  selectPlan,
} from '../controllers/subscriptions.controller.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { requireRole } from '../middleware/requireRole.js';
import { validate } from '../middleware/validate.js';
import { selectPlanSchema } from '../validators/subscriptions.schemas.js';

export const subscriptionsRouter = Router();

subscriptionsRouter.use(requireAuth);
subscriptionsRouter.post('/', requireRole('client'), validate(selectPlanSchema), selectPlan);
subscriptionsRouter.get('/:id', requireRole('client', 'admin'), getSubscription);
subscriptionsRouter.post('/:id/cancel', requireRole('client'), cancelSubscription);
