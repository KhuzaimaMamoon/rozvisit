import { Router } from 'express';
import {
  assignCaregiver,
  completeVisit,
  createMediaPermit,
  feed,
  parentDeclined,
  saveChecklist,
  scheduleVisits,
  today,
} from '../controllers/visits.controller.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { requireRole } from '../middleware/requireRole.js';
import { validate } from '../middleware/validate.js';
import {
  assignCaregiverSchema,
  checklistSchema,
  completeVisitSchema,
  mediaPermitSchema,
  parentDeclinedSchema,
  scheduleVisitsSchema,
} from '../validators/visits.schemas.js';

export const visitsRouter = Router();
visitsRouter.use(requireAuth);
visitsRouter.post(
  '/schedule',
  requireRole('client'),
  validate(scheduleVisitsSchema),
  scheduleVisits,
);
visitsRouter.post(
  '/:id/media-permit',
  requireRole('caregiver'),
  validate(mediaPermitSchema),
  createMediaPermit,
);
visitsRouter.post(
  '/:id/complete',
  requireRole('caregiver'),
  validate(completeVisitSchema),
  completeVisit,
);
visitsRouter.get('/today', requireRole('caregiver'), today);
visitsRouter.post(
  '/:id/checklist',
  requireRole('caregiver'),
  validate(checklistSchema),
  saveChecklist,
);
visitsRouter.post(
  '/:id/parent-declined',
  requireRole('caregiver'),
  validate(parentDeclinedSchema),
  parentDeclined,
);

export const adminVisitsRouter = Router();
adminVisitsRouter.use(requireAuth, requireRole('admin'));
adminVisitsRouter.post('/:id/assign', validate(assignCaregiverSchema), assignCaregiver);

export const feedRouter = Router();
feedRouter.use(requireAuth, requireRole('client'));
feedRouter.get('/', feed);
