import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { TokenExpiredError, UnauthenticatedError } from '../utils/AppError.js';

export function requireAuth(req, res, next) {
  const authorization = req.get('authorization');
  const token = authorization?.startsWith('Bearer ') ? authorization.slice('Bearer '.length) : null;

  if (!token) {
    return next(new UnauthenticatedError());
  }

  try {
    req.auth = jwt.verify(token, env.jwt.accessSecret);
    return next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return next(new TokenExpiredError());
    }
    return next(new UnauthenticatedError());
  }
}
