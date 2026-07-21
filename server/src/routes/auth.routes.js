import { Router } from 'express';
import {
  apply,
  forgot,
  login,
  logout,
  refresh,
  register,
  resendVerification,
  reset,
  verifyEmail,
} from '../controllers/auth.controller.js';
import { authRateLimit } from '../middleware/rateLimit.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { validate } from '../middleware/validate.js';
import {
  applySchema,
  emailSchema,
  loginSchema,
  registerSchema,
  resetSchema,
  verifySchema,
} from '../validators/auth.schemas.js';

export const authRouter = Router();

authRouter.post('/register', authRateLimit, validate(registerSchema), register);
authRouter.post('/apply', authRateLimit, validate(applySchema), apply);
authRouter.post('/verify-email', authRateLimit, validate(verifySchema), verifyEmail);
authRouter.post('/resend-verification', authRateLimit, validate(emailSchema), resendVerification);
authRouter.post('/login', authRateLimit, validate(loginSchema), login);
authRouter.post('/refresh', refresh);
authRouter.post('/logout', requireAuth, logout);
authRouter.post('/forgot', authRateLimit, validate(emailSchema), forgot);
authRouter.post('/reset', authRateLimit, validate(resetSchema), reset);
