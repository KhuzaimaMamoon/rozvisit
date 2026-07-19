import { RateLimitedError } from '../utils/AppError.js';

const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 10;
const attempts = new Map();

export function authRateLimit(req, res, next) {
  const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
  const key = `${req.ip}:${email}`;
  const now = Date.now();
  const entry = attempts.get(key);
  const timestamps = (entry?.timestamps ?? []).filter((timestamp) => now - timestamp < WINDOW_MS);

  if (timestamps.length >= MAX_ATTEMPTS) {
    const retryAfter = Math.ceil((WINDOW_MS - (now - timestamps[0])) / 1000);
    return next(new RateLimitedError('Please wait before trying again.', retryAfter));
  }

  timestamps.push(now);
  attempts.set(key, { timestamps });
  return next();
}
