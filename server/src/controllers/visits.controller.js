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

export const scheduleVisits = run(async (req, res) =>
  respond.created(res, await visitService.schedule(req.auth.sub, req.validatedBody)),
);
export const assignCaregiver = run(async (req, res) =>
  respond.ok(
    res,
    await visitService.assign(req.auth.sub, req.params.id, req.validatedBody.caregiverId),
  ),
);
export const today = run(async (req, res) =>
  respond.ok(res, await visitService.today(req.auth.sub)),
);
export const captureConsent = run(async (req, res) =>
  respond.ok(
    res,
    await visitService.captureConsent(req.auth.sub, req.params.id, req.validatedBody),
  ),
);
export const saveChecklist = run(async (req, res) =>
  respond.ok(res, await visitService.saveChecklist(req.auth.sub, req.params.id, req.validatedBody)),
);
export const parentDeclined = run(async (req, res) =>
  respond.ok(
    res,
    await visitService.parentDeclined(req.auth.sub, req.params.id, req.validatedBody),
  ),
);
export const feed = run(async (req, res) =>
  respond.ok(res, await visitService.feed(req.auth.sub, req.query.parentId)),
);
