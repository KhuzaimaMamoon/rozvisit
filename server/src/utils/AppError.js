export class AppError extends Error {
  constructor(code, message, { status = 500, fields, cause, expose = false } = {}) {
    super(message, cause ? { cause } : undefined);
    this.name = this.constructor.name;
    this.code = code;
    this.status = status;
    this.fields = fields;
    this.cause = cause;
    this.expose = expose;
  }
}

export class ValidationError extends AppError {
  constructor(message, fields) {
    super('VALIDATION_FAILED', message, { status: 422, fields, expose: true });
  }
}

export class UnauthenticatedError extends AppError {
  constructor(message = 'Please sign in to continue.') {
    super('UNAUTHENTICATED', message, { status: 401, expose: true });
  }
}

export class TokenExpiredError extends AppError {
  constructor(message = 'Your session has expired. Please sign in again.') {
    super('TOKEN_EXPIRED', message, { status: 401, expose: true });
  }
}

export class ForbiddenError extends AppError {
  constructor(code = 'FORBIDDEN', message = 'You do not have permission to do that.') {
    super(code, message, { status: 403, expose: true });
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'The requested resource was not found.') {
    super('NOT_FOUND', message, { status: 404, expose: true });
  }
}

export class ConflictError extends AppError {
  constructor(code, message) {
    super(code, message, { status: 409, expose: true });
  }
}

export class GoneError extends AppError {
  constructor(code = 'STATE_EXPIRED', message = 'This link has expired.') {
    super(code, message, { status: 410, expose: true });
  }
}

export class RateLimitedError extends AppError {
  constructor(message, retryAfter) {
    super('RATE_LIMITED', message, { status: 429, expose: true });
    this.retryAfter = retryAfter;
  }
}

export class UpstreamError extends AppError {
  constructor(code = 'UPSTREAM_FAILED', message = 'A service is temporarily unavailable.', cause) {
    const status = code === 'MAINTENANCE' ? 503 : code === 'DB_TIMEOUT' ? 504 : 502;
    super(code, message, { status, cause });
  }
}

export class InternalError extends AppError {
  constructor(cause) {
    super('INTERNAL', 'An unexpected error occurred.', { status: 500, cause });
  }
}
