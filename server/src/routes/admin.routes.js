import { Router } from 'express';
import {
  decideApplication,
  getApplication,
  listApplications,
  recordCnicGate,
  recordInterviewGate,
  recordReferenceGate,
} from '../controllers/admin.controller.js';
import { ADMIN_PERMISSIONS, ROLES } from '../config/constants.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { requirePermission } from '../middleware/requirePermission.js';
import { requireRole } from '../middleware/requireRole.js';
import { validate, validateQuery } from '../middleware/validate.js';
import {
  applicationDecisionSchema,
  applicationListQuerySchema,
  cnicGateSchema,
  interviewGateSchema,
  referenceGateSchema,
} from '../validators/admin.schemas.js';

export const adminApplicationsRouter = Router();

adminApplicationsRouter.use(
  requireAuth,
  requireRole(ROLES.ADMIN),
  requirePermission(ADMIN_PERMISSIONS.APPLICATIONS_REVIEW),
);
adminApplicationsRouter.get('/', validateQuery(applicationListQuerySchema), listApplications);
adminApplicationsRouter.get('/:id', getApplication);
adminApplicationsRouter.patch('/:id/cnic-gate', validate(cnicGateSchema), recordCnicGate);
adminApplicationsRouter.patch(
  '/:id/interview-gate',
  validate(interviewGateSchema),
  recordInterviewGate,
);
adminApplicationsRouter.patch(
  '/:id/reference-gate',
  validate(referenceGateSchema),
  recordReferenceGate,
);
adminApplicationsRouter.post(
  '/:id/decision',
  validate(applicationDecisionSchema),
  decideApplication,
);
