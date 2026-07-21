import { env } from '../config/env.js';
import { ForbiddenError } from '../utils/AppError.js';

const ALLOWED_METHODS = 'GET,HEAD,POST,PATCH,PUT,DELETE,OPTIONS';
const ALLOWED_HEADERS = 'Content-Type, Authorization, X-RozVisit-Portal';

export function cors(req, res, next) {
  const origin = req.get('Origin');

  // Server-to-server and same-origin calls do not carry Origin. Browser calls
  // must match the public portal origin configured through APP_BASE_URL.
  if (!origin) return next();

  if (origin !== env.appOrigin) {
    return next(
      new ForbiddenError('CORS_ORIGIN_NOT_ALLOWED', 'This origin is not allowed to call the API.'),
    );
  }

  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', ALLOWED_METHODS);
  res.setHeader('Access-Control-Allow-Headers', ALLOWED_HEADERS);
  res.setHeader('Access-Control-Max-Age', '600');
  res.setHeader('Vary', 'Origin');

  if (req.method === 'OPTIONS') return res.sendStatus(204);
  return next();
}
