import { ForbiddenError, UnauthenticatedError } from '../utils/AppError.js';
import { userRepository } from '../repositories/user.repo.js';

export function requirePermission(permission) {
  return async (req, res, next) => {
    if (!req.auth?.sub) return next(new UnauthenticatedError());

    try {
      const user = await userRepository.findByIdWithPermissions(req.auth.sub);
      if (!user || !user.permissions.includes(permission)) return next(new ForbiddenError());
      return next();
    } catch (error) {
      return next(error);
    }
  };
}
