import { randomBytes } from 'node:crypto';

export function correlationId(req, res, next) {
  const date = new Date().toISOString().slice(0, 10);
  req.correlationId = `req_${date}_${randomBytes(4).toString('hex')}`;
  res.setHeader('X-Correlation-ID', req.correlationId);
  next();
}
