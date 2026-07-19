import { subscriptionService } from '../services/subscription.service.js';
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

export const listPlans = run(async (req, res) =>
  respond.ok(res, await subscriptionService.listPlans(req.auth.sub)),
);
export const selectPlan = run(async (req, res) =>
  respond.created(res, await subscriptionService.selectPlan(req.auth.sub, req.validatedBody)),
);
export const getSubscription = run(async (req, res) =>
  respond.ok(res, await subscriptionService.getSubscription(req.auth, req.params.id)),
);
export const cancelSubscription = run(async (req, res) =>
  respond.ok(res, await subscriptionService.cancelSubscription(req.auth.sub, req.params.id)),
);
export const updateAdminState = run(async (req, res) =>
  respond.ok(
    res,
    await subscriptionService.updateAdminState(req.auth.sub, req.params.id, req.validatedBody),
  ),
);
export const listAdminSubscriptions = run(async (req, res) =>
  respond.ok(res, await subscriptionService.listAdminSubscriptions(req.query.state)),
);
