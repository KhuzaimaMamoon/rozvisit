import { ValidationError } from '../utils/AppError.js';

export function validate(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return next(
        new ValidationError(
          'Please fix the highlighted fields.',
          result.error.flatten().fieldErrors,
        ),
      );
    }

    req.validatedBody = result.data;
    return next();
  };
}

export function validateQuery(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.query);
    if (!result.success) {
      return next(
        new ValidationError(
          'Please fix the highlighted fields.',
          result.error.flatten().fieldErrors,
        ),
      );
    }
    req.validatedQuery = result.data;
    return next();
  };
}
