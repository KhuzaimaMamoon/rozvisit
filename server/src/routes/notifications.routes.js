import { Router } from 'express';
import {
  listNotificationFailures,
  listNotifications,
  markNotificationRead,
} from '../controllers/notifications.controller.js';
import { ROLES } from '../config/constants.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { requireRole } from '../middleware/requireRole.js';
import { validateQuery } from '../middleware/validate.js';
import {
  notificationFailuresQuerySchema,
  notificationListQuerySchema,
} from '../validators/notifications.schemas.js';

export const notificationsRouter = Router();

notificationsRouter.use(requireAuth);
notificationsRouter.get('/', validateQuery(notificationListQuerySchema), listNotifications);
notificationsRouter.get(
  '/failures',
  requireRole(ROLES.ADMIN),
  validateQuery(notificationFailuresQuerySchema),
  listNotificationFailures,
);
notificationsRouter.post('/:id/read', markNotificationRead);
