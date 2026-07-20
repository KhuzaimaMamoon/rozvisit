import { authService } from '../services/auth.service.js';
import { env } from '../config/env.js';
import { respond } from '../utils/respond.js';

const REFRESH_COOKIE = 'refreshToken';
const cookieOptions = Object.freeze({
  httpOnly: true,
  secure: env.nodeEnv === 'production',
  sameSite: 'strict',
  path: '/api/v1/auth',
});

function run(handler) {
  return async (req, res, next) => {
    try {
      await handler(req, res);
    } catch (error) {
      next(error);
    }
  };
}

function setRefreshCookie(res, refreshToken) {
  res.cookie(REFRESH_COOKIE, refreshToken, { ...cookieOptions, maxAge: 7 * 24 * 60 * 60 * 1000 });
}

export const register = run(async (req, res) =>
  respond.created(res, await authService.register(req.validatedBody)),
);
export const apply = run(async (req, res) =>
  respond.created(res, await authService.apply(req.validatedBody)),
);
export const verifyEmail = run(async (req, res) =>
  respond.ok(res, await authService.verifyEmail(req.validatedBody)),
);
export const resendVerification = run(async (req, res) =>
  respond.ok(res, await authService.resendVerification(req.validatedBody)),
);
export const login = run(async (req, res) => {
  const result = await authService.login(req.validatedBody);
  setRefreshCookie(res, result.refreshToken);
  respond.ok(res, { accessToken: result.accessToken, user: result.user });
});
export const refresh = run(async (req, res) => {
  const result = await authService.refresh({ refreshToken: req.cookies[REFRESH_COOKIE] });
  setRefreshCookie(res, result.refreshToken);
  respond.ok(res, { accessToken: result.accessToken });
});
export const logout = run(async (req, res) => {
  await authService.logout({ refreshToken: req.cookies[REFRESH_COOKIE] });
  res.clearCookie(REFRESH_COOKIE, cookieOptions);
  respond.ok(res, { loggedOut: true });
});
export const forgot = run(async (req, res) =>
  respond.ok(res, await authService.forgotPassword(req.validatedBody)),
);
export const reset = run(async (req, res) =>
  respond.ok(res, await authService.resetPassword(req.validatedBody)),
);
