import { Router } from 'express';
import {
  listCaregiverDirectory,
  listClientDirectory,
  viewCaregiverCnic,
} from '../controllers/admin.controller.js';
import { ADMIN_PERMISSIONS, ROLES } from '../config/constants.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { requirePermission } from '../middleware/requirePermission.js';
import { requireRole } from '../middleware/requireRole.js';
import { validateQuery } from '../middleware/validate.js';
import { directoryListQuerySchema } from '../validators/admin.schemas.js';

export const adminDirectoriesRouter = Router();

adminDirectoriesRouter.use(requireAuth, requireRole(ROLES.ADMIN));
adminDirectoriesRouter.get(
  '/caregivers',
  requirePermission(ADMIN_PERMISSIONS.CAREGIVERS_DIRECTORY_VIEW),
  validateQuery(directoryListQuerySchema),
  listCaregiverDirectory,
);
adminDirectoriesRouter.get(
  '/caregivers/:id/cnic',
  requirePermission(ADMIN_PERMISSIONS.CAREGIVERS_CNIC_VIEW),
  viewCaregiverCnic,
);
adminDirectoriesRouter.get(
  '/clients',
  requirePermission(ADMIN_PERMISSIONS.CLIENTS_DIRECTORY_VIEW),
  validateQuery(directoryListQuerySchema),
  listClientDirectory,
);
