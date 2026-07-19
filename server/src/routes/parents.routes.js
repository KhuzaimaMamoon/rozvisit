import { Router } from 'express';
import {
  createParent,
  captureConsent,
  getParent,
  listParents,
  updateParent,
  withdrawConsent,
} from '../controllers/parents.controller.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { requireRole } from '../middleware/requireRole.js';
import { validate } from '../middleware/validate.js';
import { createParentSchema, updateParentSchema } from '../validators/parents.schemas.js';
import { consentSchema } from '../validators/visits.schemas.js';

export const parentsRouter = Router();

parentsRouter.use(requireAuth);
parentsRouter.post('/', requireRole('client'), validate(createParentSchema), createParent);
parentsRouter.get('/', requireRole('client'), listParents);
parentsRouter.post(
  '/:id/consent',
  requireRole('caregiver'),
  validate(consentSchema),
  captureConsent,
);
parentsRouter.post('/:id/consent/withdraw', requireRole('client', 'admin'), withdrawConsent);
parentsRouter.get('/:id', requireRole('client', 'admin'), getParent);
parentsRouter.patch('/:id', requireRole('client'), validate(updateParentSchema), updateParent);
