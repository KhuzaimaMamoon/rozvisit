import { adminService } from '../services/admin.service.js';
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

export const listApplications = run(async (req, res) =>
  respond.ok(res, await adminService.listApplications(req.validatedQuery)),
);
export const getApplication = run(async (req, res) =>
  respond.ok(res, await adminService.getApplication(req.auth.sub, req.params.id)),
);
export const recordCnicGate = run(async (req, res) =>
  respond.ok(
    res,
    await adminService.recordCnicGate(req.auth.sub, req.params.id, req.validatedBody),
  ),
);
export const recordInterviewGate = run(async (req, res) =>
  respond.ok(
    res,
    await adminService.recordInterviewGate(req.auth.sub, req.params.id, req.validatedBody),
  ),
);
export const recordReferenceGate = run(async (req, res) =>
  respond.ok(
    res,
    await adminService.recordReferenceGate(req.auth.sub, req.params.id, req.validatedBody),
  ),
);
export const decideApplication = run(async (req, res) =>
  respond.ok(
    res,
    await adminService.decideApplication(req.auth.sub, req.params.id, req.validatedBody),
  ),
);
export const assignmentSuggestions = run(async (req, res) =>
  respond.ok(res, await adminService.assignmentSuggestions(req.params.id)),
);
export const assignVisit = run(async (req, res) =>
  respond.ok(
    res,
    await adminService.assignVisit(req.auth.sub, req.params.id, req.validatedBody.caregiverId),
  ),
);
export const listVisits = run(async (req, res) =>
  respond.ok(res, await adminService.listVisits(req.validatedQuery)),
);
export const getVisitEvidence = run(async (req, res) =>
  respond.ok(res, await adminService.getVisitEvidence(req.auth.sub, req.params.id)),
);
export const resolveFlag = run(async (req, res) =>
  respond.ok(res, await adminService.resolveFlag(req.auth.sub, req.params.id, req.validatedBody)),
);
export const markMissed = run(async (req, res) =>
  respond.ok(res, await adminService.markMissed(req.auth.sub, req.params.id, req.validatedBody)),
);
