import { AppError, ConflictError, InternalError } from '../utils/AppError.js';
import { logger } from '../utils/logger.js';
import { respond } from '../utils/respond.js';

export function errorHandler(error, req, res, next) {
  if (res.headersSent) {
    return next(error);
  }

  const appError =
    error instanceof AppError
      ? error
      : error?.code === 11000
        ? new ConflictError(
            'DUPLICATE',
            'An account already uses this email. Please sign in or reset your password.',
          )
        : new InternalError(error);
  const logContext = {
    correlationId: req.correlationId,
    code: appError.code,
    status: appError.status,
    cause: appError.cause?.message,
  };

  if (appError.status >= 500) {
    logger.error('request.failed', logContext);
  } else {
    logger.warn('request.refused', logContext);
  }

  if (appError.retryAfter) {
    res.setHeader('Retry-After', appError.retryAfter);
  }

  return respond.error(res, appError, req.correlationId);
}
