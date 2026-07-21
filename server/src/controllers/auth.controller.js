import { authService } from '../services/auth.service.js';
import { ROLES } from '../config/constants.js';
import { env } from '../config/env.js';
import { respond } from '../utils/respond.js';

const LEGACY_REFRESH_COOKIE = 'refreshToken';
const PORTAL_ROLE_HEADER = 'x-rozvisit-portal';
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

function refreshCookieName(role) {
  return `refreshToken_${role}`;
}

function portalRole(req) {
  const value = req.get(PORTAL_ROLE_HEADER);
  return Object.values(ROLES).includes(value) ? value : null;
}

function refreshCookieForRequest(req, role) {
  if (role) return req.cookies[refreshCookieName(role)] ?? req.cookies[LEGACY_REFRESH_COOKIE];
  const scopedTokens = Object.values(ROLES)
    .map((candidate) => req.cookies[refreshCookieName(candidate)])
    .filter(Boolean);
  return scopedTokens.length === 1 ? scopedTokens[0] : req.cookies[LEGACY_REFRESH_COOKIE];
}

function setRefreshCookie(res, refreshToken, role) {
  res.cookie(refreshCookieName(role), refreshToken, {
    ...cookieOptions,
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
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
  setRefreshCookie(res, result.refreshToken, result.user.role);
  respond.ok(res, { accessToken: result.accessToken, user: result.user });
});
export const refresh = run(async (req, res) => {
  const expectedRole = portalRole(req);
  const result = await authService.refresh({
    expectedRole,
    refreshToken: refreshCookieForRequest(req, expectedRole),
  });
  setRefreshCookie(res, result.refreshToken, result.user.role);
  respond.ok(res, { accessToken: result.accessToken, user: result.user });
});
export const logout = run(async (req, res) => {
  const role = req.auth.role;
  await authService.logout({ refreshToken: refreshCookieForRequest(req, role) });
  res.clearCookie(refreshCookieName(role), cookieOptions);
  res.clearCookie(LEGACY_REFRESH_COOKIE, cookieOptions);
  respond.ok(res, { loggedOut: true });
});
export const forgot = run(async (req, res) =>
  respond.ok(res, await authService.forgotPassword(req.validatedBody)),
);
export const reset = run(async (req, res) =>
  respond.ok(res, await authService.resetPassword(req.validatedBody)),
);
