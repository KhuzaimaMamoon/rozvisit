import bcrypt from 'bcrypt';
import { createHash, randomBytes, randomUUID } from 'node:crypto';
import jwt from 'jsonwebtoken';
import {
  CAREGIVER_STATUS,
  COUNTRY_CURRENCY_MAP,
  DEFAULT_CURRENCY,
  ROLES,
  USER_STATUS,
} from '../config/constants.js';
import { env } from '../config/env.js';
import { AUTH_TOKEN_TYPES } from '../models/AuthToken.js';
import { caregiverRepository } from '../repositories/caregiver.repo.js';
import { tokenRepository } from '../repositories/token.repo.js';
import { userRepository } from '../repositories/user.repo.js';
import {
  ConflictError,
  ForbiddenError,
  GoneError,
  UnauthenticatedError,
} from '../utils/AppError.js';
import { encrypt } from '../utils/crypto.js';
import { logger } from '../utils/logger.js';
import { emailChannel } from '../interfaces/channel.email.js';

const BCRYPT_COST = 10;
const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY = '7d';
const EMAIL_VERIFICATION_EXPIRY_MS = 24 * 60 * 60 * 1000;
const PASSWORD_RESET_EXPIRY_MS = 60 * 60 * 1000;
const PROGRESSIVE_DELAY_AFTER = 5;
const PROGRESSIVE_DELAY_MS = 1000;
const DUMMY_PASSWORD_HASH = '$2b$10$PpbAcrK4aD7gFuQb7LJZk.43q69CYhf7trM7.7VXx4wsaNpoZjT8K';
const failures = new Map();

function hashToken(token) {
  return createHash('sha256').update(token).digest('hex');
}

function makeRawToken() {
  return randomBytes(32).toString('hex');
}

function signAccessToken(user) {
  return jwt.sign({ role: user.role }, env.jwt.accessSecret, {
    algorithm: 'HS256',
    subject: user._id.toString(),
    expiresIn: ACCESS_TOKEN_EXPIRY,
  });
}

function signRefreshToken(user) {
  return jwt.sign({}, env.jwt.refreshSecret, {
    algorithm: 'HS256',
    subject: user._id.toString(),
    expiresIn: REFRESH_TOKEN_EXPIRY,
    jwtid: randomUUID(),
  });
}

function refreshExpiry() {
  return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
}

function userResponse(user) {
  return { id: user._id.toString(), name: user.name, role: user.role, status: user.status };
}

function genericCredentialsError() {
  return new UnauthenticatedError('Email or password is incorrect.');
}

function failureKey(email) {
  return email.trim().toLowerCase();
}

async function applyProgressiveDelay(email) {
  const count = failures.get(failureKey(email)) ?? 0;
  if (count >= PROGRESSIVE_DELAY_AFTER) {
    await new Promise((resolve) => setTimeout(resolve, PROGRESSIVE_DELAY_MS));
  }
}

function recordFailedLogin(email) {
  failures.set(failureKey(email), (failures.get(failureKey(email)) ?? 0) + 1);
}

function clearFailedLogins(email) {
  failures.delete(failureKey(email));
}

async function issueEmailToken(user, type) {
  const rawToken = makeRawToken();
  const expiresAt = new Date(
    Date.now() +
      (type === AUTH_TOKEN_TYPES.EMAIL_VERIFICATION
        ? EMAIL_VERIFICATION_EXPIRY_MS
        : PASSWORD_RESET_EXPIRY_MS),
  );
  await tokenRepository.createAuthToken({
    userId: user._id,
    tokenHash: hashToken(rawToken),
    type,
    expiresAt,
  });

  const path =
    type === AUTH_TOKEN_TYPES.EMAIL_VERIFICATION
      ? '/verify-email?token='
      : '/reset-password?token=';
  await emailChannel.send({ type, to: user.email, link: `${env.appBaseUrl}${path}${rawToken}` });
}

export const authService = Object.freeze({
  async register({ name, email, phone, countryCode, password }) {
    const existing = await userRepository.findByEmail(email);
    if (existing) {
      throw new ConflictError(
        'DUPLICATE',
        'An account already uses this email. Please sign in or reset your password.',
      );
    }

    const user = await userRepository.createUser({
      role: ROLES.CLIENT,
      name,
      email,
      phone,
      passwordHash: await bcrypt.hash(password, BCRYPT_COST),
      status: USER_STATUS.ACTIVE,
    });
    await userRepository.createClientProfile({
      userId: user._id,
      countryCode,
      currency: COUNTRY_CURRENCY_MAP[countryCode] ?? DEFAULT_CURRENCY,
    });
    await issueEmailToken(user, AUTH_TOKEN_TYPES.EMAIL_VERIFICATION);
    return { userId: user._id.toString() };
  },

  async apply({ name, email, phone, password, cnicNumber, serviceArea }) {
    const existing = await userRepository.findByEmail(email);
    if (existing) {
      throw new ConflictError(
        'DUPLICATE',
        'An account already uses this email. Please sign in or reset your password.',
      );
    }

    const user = await userRepository.createUser({
      role: ROLES.CAREGIVER,
      name,
      email,
      phone,
      passwordHash: await bcrypt.hash(password, BCRYPT_COST),
      status: USER_STATUS.ACTIVE,
    });
    await caregiverRepository.create({
      userId: user._id,
      verification: { cnicNumber: encrypt(cnicNumber), gates: {} },
      serviceArea: {
        type: 'Point',
        coordinates: [serviceArea.lng, serviceArea.lat],
        radiusKm: serviceArea.radiusKm,
      },
      status: CAREGIVER_STATUS.APPLIED,
    });
    await issueEmailToken(user, AUTH_TOKEN_TYPES.EMAIL_VERIFICATION);
    return {
      userId: user._id.toString(),
      status: CAREGIVER_STATUS.APPLIED,
      nextStep: 'We will review your application.',
    };
  },

  async verifyEmail({ token }) {
    const record = await tokenRepository.consumeAuthToken(
      hashToken(token),
      AUTH_TOKEN_TYPES.EMAIL_VERIFICATION,
      new Date(),
    );
    if (!record) throw new GoneError('STATE_INVALID');
    await userRepository.markEmailVerified(record.userId, new Date());
    return { verified: true };
  },

  async resendVerification({ email }) {
    const user = await userRepository.findByEmail(email);
    if (user && !user.emailVerifiedAt)
      await issueEmailToken(user, AUTH_TOKEN_TYPES.EMAIL_VERIFICATION);
    return { message: 'If an account needs verification, we have sent an email.' };
  },

  async login({ email, password }) {
    const user = await userRepository.findByEmailWithPassword(email);
    const matches = await bcrypt.compare(password, user?.passwordHash ?? DUMMY_PASSWORD_HASH);
    if (!user || !matches || !user.emailVerifiedAt) {
      await applyProgressiveDelay(email);
      recordFailedLogin(email);
      logger.warn('auth.login_failed', { email, reason: 'invalid_credentials' });
      throw genericCredentialsError();
    }
    if (user.status === USER_STATUS.DISABLED) {
      throw new ForbiddenError(
        'ACCOUNT_DISABLED',
        'This account is disabled. Please contact support.',
      );
    }
    clearFailedLogins(email);
    const refreshToken = signRefreshToken(user);
    await tokenRepository.createRefresh({
      userId: user._id,
      tokenHash: hashToken(refreshToken),
      expiresAt: refreshExpiry(),
    });
    return { accessToken: signAccessToken(user), refreshToken, user: userResponse(user) };
  },

  async refresh({ refreshToken }) {
    if (!refreshToken) throw new UnauthenticatedError();
    let payload;
    try {
      payload = jwt.verify(refreshToken, env.jwt.refreshSecret, { algorithms: ['HS256'] });
    } catch {
      throw new UnauthenticatedError();
    }
    const tokenHash = hashToken(refreshToken);
    const session = await tokenRepository.findActiveRefresh(tokenHash);
    if (!session || session.userId.toString() !== payload.sub) throw new UnauthenticatedError();
    const user = await userRepository.findById(payload.sub);
    if (!user || user.status === USER_STATUS.DISABLED) throw new UnauthenticatedError();
    await tokenRepository.revokeRefresh(tokenHash, new Date());
    const nextRefreshToken = signRefreshToken(user);
    await tokenRepository.createRefresh({
      userId: user._id,
      tokenHash: hashToken(nextRefreshToken),
      expiresAt: refreshExpiry(),
    });
    return { accessToken: signAccessToken(user), refreshToken: nextRefreshToken };
  },

  async logout({ refreshToken }) {
    if (refreshToken) await tokenRepository.revokeRefresh(hashToken(refreshToken), new Date());
  },

  async forgotPassword({ email }) {
    const user = await userRepository.findByEmail(email);
    if (user) await issueEmailToken(user, AUTH_TOKEN_TYPES.PASSWORD_RESET);
    return { message: 'If an account matches this email, we have sent reset instructions.' };
  },

  async resetPassword({ token, newPassword }) {
    const record = await tokenRepository.consumeAuthToken(
      hashToken(token),
      AUTH_TOKEN_TYPES.PASSWORD_RESET,
      new Date(),
    );
    if (!record) throw new GoneError('STATE_INVALID');
    await userRepository.updatePassword(record.userId, await bcrypt.hash(newPassword, BCRYPT_COST));
    await tokenRepository.revokeAllRefreshForUser(record.userId, new Date());
    return { reset: true };
  },
});
