import { Router } from 'express';
import {
  listAdminSubscriptions,
  updateAdminState,
} from '../controllers/subscriptions.controller.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { requireRole } from '../middleware/requireRole.js';
import { validate } from '../middleware/validate.js';
import { updateSubscriptionStateSchema } from '../validators/subscriptions.schemas.js';

export const adminSubscriptionsRouter = Router();

adminSubscriptionsRouter.use(requireAuth, requireRole('admin'));
adminSubscriptionsRouter.get('/', listAdminSubscriptions);
adminSubscriptionsRouter.patch(
  '/:id/state',
  validate(updateSubscriptionStateSchema),
  updateAdminState,
);
