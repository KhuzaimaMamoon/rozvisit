import { Router } from 'express';
import {
  completeVisit,
  createMediaPermit,
  feed,
  getCaregiverVisit,
  mine,
  parentDeclined,
  saveChecklist,
  scheduleVisits,
  today,
} from '../controllers/visits.controller.js';
import {
  assignVisit,
  assignmentSuggestions,
  getVisitEvidence,
  listVisits,
  markMissed,
  resolveFlag,
} from '../controllers/admin.controller.js';
import { ADMIN_PERMISSIONS, ROLES } from '../config/constants.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { requirePermission } from '../middleware/requirePermission.js';
import { requireRole } from '../middleware/requireRole.js';
import { validate, validateQuery } from '../middleware/validate.js';
import {
  adminVisitsQuerySchema,
  markMissedSchema,
  resolveFlagSchema,
} from '../validators/admin.schemas.js';
import {
  assignCaregiverSchema,
  checklistSchema,
  completeVisitSchema,
  mediaPermitSchema,
  caregiverVisitsQuerySchema,
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
visitsRouter.get(
  '/mine',
  requireRole('caregiver'),
  validateQuery(caregiverVisitsQuerySchema),
  mine,
);
visitsRouter.get('/:id', requireRole('caregiver'), getCaregiverVisit);
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
adminVisitsRouter.use(requireAuth, requireRole(ROLES.ADMIN));
adminVisitsRouter.get(
  '/',
  requirePermission(ADMIN_PERMISSIONS.VISITS_OVERSEE),
  validateQuery(adminVisitsQuerySchema),
  listVisits,
);
adminVisitsRouter.get(
  '/:id/assignment-suggestions',
  requirePermission(ADMIN_PERMISSIONS.VISITS_OVERSEE),
  assignmentSuggestions,
);
adminVisitsRouter.post(
  '/:id/assign',
  requirePermission(ADMIN_PERMISSIONS.VISITS_OVERSEE),
  validate(assignCaregiverSchema),
  assignVisit,
);
adminVisitsRouter.post(
  '/:id/mark-missed',
  requirePermission(ADMIN_PERMISSIONS.VISITS_OVERSEE),
  validate(markMissedSchema),
  markMissed,
);
adminVisitsRouter.get(
  '/:id',
  requirePermission(ADMIN_PERMISSIONS.VISITS_OVERSEE),
  getVisitEvidence,
);

export const adminFlagsRouter = Router();
adminFlagsRouter.use(
  requireAuth,
  requireRole(ROLES.ADMIN),
  requirePermission(ADMIN_PERMISSIONS.FLAGS_RESOLVE),
);
adminFlagsRouter.post('/:id/resolve', validate(resolveFlagSchema), resolveFlag);

export const feedRouter = Router();
feedRouter.use(requireAuth, requireRole('client'));
feedRouter.get('/', feed);
