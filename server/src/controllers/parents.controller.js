import { profileService } from '../services/profile.service.js';
import { visitService } from '../services/visit.service.js';
import { respond } from '../utils/respond.js';

function run(handler) {
  return async (req, res, next) => {
    try {
      await handler(req, res);
    } catch (error) {
      next(error);
    }
  };
}

export const createParent = run(async (req, res) =>
  respond.created(res, await profileService.createParent(req.auth.sub, req.validatedBody)),
);
export const listParents = run(async (req, res) =>
  respond.ok(res, { items: await profileService.listParents(req.auth.sub) }),
);
export const getParent = run(async (req, res) =>
  respond.ok(res, await profileService.getParent(req.auth, req.params.id)),
);
export const updateParent = run(async (req, res) =>
  respond.ok(
    res,
    await profileService.updateParent(req.auth.sub, req.params.id, req.validatedBody),
  ),
);
export const withdrawConsent = run(async (req, res) =>
  respond.ok(res, await profileService.withdrawConsent(req.auth, req.params.id)),
);
export const captureConsent = run(async (req, res) =>
  respond.ok(
    res,
    await visitService.captureConsent(req.auth.sub, req.params.id, req.validatedBody),
  ),
);
export const createConsentPermit = run(async (req, res) =>
  respond.ok(
    res,
    await visitService.createConsentPermit(req.auth.sub, req.params.id, req.validatedBody),
  ),
);
export const createConsentPlayback = run(async (req, res) =>
  respond.ok(res, await profileService.createConsentPlayback(req.auth, req.params.id)),
);
