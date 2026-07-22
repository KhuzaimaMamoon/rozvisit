import { Router } from 'express';
import {
  archiveCaregiver,
  archiveClient,
  listCaregiverDirectory,
  listClientDirectory,
  reactivateCaregiver,
  reactivateClient,
  viewCaregiverCnic,
} from '../controllers/admin.controller.js';
import { ADMIN_PERMISSIONS, ROLES } from '../config/constants.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { requirePermission } from '../middleware/requirePermission.js';
import { requireRole } from '../middleware/requireRole.js';
import { validate, validateQuery } from '../middleware/validate.js';
import { archiveSchema, directoryListQuerySchema } from '../validators/admin.schemas.js';

export const adminDirectoriesRouter = Router();

adminDirectoriesRouter.use(requireAuth, requireRole(ROLES.ADMIN));
adminDirectoriesRouter.get(
  '/caregivers',
  requirePermission(ADMIN_PERMISSIONS.CAREGIVERS_DIRECTORY_VIEW),
  validateQuery(directoryListQuerySchema),
  listCaregiverDirectory,
);
adminDirectoriesRouter.patch(
  '/caregivers/:id/archive',
  requirePermission(ADMIN_PERMISSIONS.CAREGIVERS_MANAGE),
  validate(archiveSchema),
  archiveCaregiver,
);
adminDirectoriesRouter.patch(
  '/caregivers/:id/reactivate',
  requirePermission(ADMIN_PERMISSIONS.CAREGIVERS_MANAGE),
  reactivateCaregiver,
);
adminDirectoriesRouter.get(
  '/caregivers/:id/cnic',
  requirePermission(ADMIN_PERMISSIONS.CAREGIVERS_CNIC_VIEW),
  viewCaregiverCnic,
);
adminDirectoriesRouter.patch(
  '/clients/:id/archive',
  requirePermission(ADMIN_PERMISSIONS.CLIENTS_MANAGE),
  validate(archiveSchema),
  archiveClient,
);
adminDirectoriesRouter.patch(
  '/clients/:id/reactivate',
  requirePermission(ADMIN_PERMISSIONS.CLIENTS_MANAGE),
  reactivateClient,
);
adminDirectoriesRouter.get(
  '/clients',
  requirePermission(ADMIN_PERMISSIONS.CLIENTS_DIRECTORY_VIEW),
  validateQuery(directoryListQuerySchema),
  listClientDirectory,
);
