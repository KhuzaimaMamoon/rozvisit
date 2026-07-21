import { notificationService } from '../services/notification.service.js';
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

export const listNotifications = run(async (req, res) =>
  respond.ok(res, await notificationService.list(req.auth, req.validatedQuery)),
);
export const markNotificationRead = run(async (req, res) =>
  respond.ok(res, await notificationService.markRead(req.auth.sub, req.params.id)),
);
export const listNotificationFailures = run(async (req, res) =>
  respond.ok(res, await notificationService.listFailures(req.validatedQuery)),
);
