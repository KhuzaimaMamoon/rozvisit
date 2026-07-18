import { ForbiddenError, UnauthenticatedError } from '../utils/AppError.js';

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.auth) {
      return next(new UnauthenticatedError());
    }

    if (!roles.includes(req.auth.role)) {
      return next(new ForbiddenError());
    }

    return next();
  };
}
