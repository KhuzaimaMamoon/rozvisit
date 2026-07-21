import { afterAll, beforeAll, beforeEach, describe, expect, it } from '@jest/globals';
import bcrypt from 'bcrypt';
import { createHash, randomBytes } from 'node:crypto';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { AUTH_TOKEN_TYPES, AuthToken } from '../src/models/AuthToken.js';
import { CaregiverProfile } from '../src/models/CaregiverProfile.js';
import { ClientProfile } from '../src/models/ClientProfile.js';
import { RefreshToken } from '../src/models/RefreshToken.js';
import { User } from '../src/models/User.js';

const PASSWORD = 'safePass123';
const validRegistration = {
  name: 'Ayesha Khan',
  email: 'ayesha@example.com',
  phone: '+971501234567',
  countryCode: 'AE',
  password: PASSWORD,
};

function hash(token) {
  return createHash('sha256').update(token).digest('hex');
}

function refreshCookie(response) {
  return response.headers['set-cookie'][0].split(';')[0];
}

describe('Auth API', () => {
  let app;
  let mongo;

  beforeAll(async () => {
    mongo = await MongoMemoryServer.create();
    await mongoose.connect(mongo.getUri());
    app = createApp();
  });

  beforeEach(async () => {
    await Promise.all([
      User.deleteMany({}),
      ClientProfile.deleteMany({}),
      CaregiverProfile.deleteMany({}),
      AuthToken.deleteMany({}),
      RefreshToken.deleteMany({}),
    ]);
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongo.stop();
  });

  async function createVerifiedUser(overrides = {}) {
    return User.create({
      role: 'client',
      name: 'Verified User',
      email: 'verified@example.com',
      phone: '+14155550100',
      passwordHash: await bcrypt.hash(PASSWORD, 10),
      emailVerifiedAt: new Date(),
      status: 'active',
      ...overrides,
    });
  }

  async function createToken(user, type) {
    const rawToken = randomBytes(32).toString('hex');
    await AuthToken.create({
      userId: user._id,
      tokenHash: hash(rawToken),
      type,
      expiresAt: new Date(Date.now() + 60_000),
    });
    return rawToken;
  }

  it('registers a client with a mapped currency and no session', async () => {
    const response = await request(app).post('/api/v1/auth/register').send(validRegistration);

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data.userId).toEqual(expect.any(String));
    expect(response.headers['set-cookie']).toBeUndefined();
    const profile = await ClientProfile.findOne({ userId: response.body.data.userId });
    expect(profile.currency).toBe('AED');
    expect(await AuthToken.countDocuments({ type: AUTH_TOKEN_TYPES.EMAIL_VERIFICATION })).toBe(1);
  });

  it('rejects duplicate registration and invalid registration input', async () => {
    await request(app).post('/api/v1/auth/register').send(validRegistration);
    const duplicate = await request(app).post('/api/v1/auth/register').send(validRegistration);
    const invalid = await request(app)
      .post('/api/v1/auth/register')
      .send({ ...validRegistration, password: 'short' });

    expect(duplicate.status).toBe(409);
    expect(duplicate.body.error.code).toBe('DUPLICATE');
    expect(invalid.status).toBe(422);
    expect(invalid.body.error.code).toBe('VALIDATION_FAILED');
  });

  it('creates a caregiver application and encrypts its CNIC', async () => {
    const response = await request(app)
      .post('/api/v1/auth/apply')
      .send({
        name: 'Bilal Ahmed',
        email: 'bilal@example.com',
        phone: '+923001234567',
        password: PASSWORD,
        cnicNumber: '1234567890123',
        serviceArea: { lng: 73.0479, lat: 33.6844, radiusKm: 10 },
      });

    expect(response.status).toBe(201);
    expect(response.body.data.status).toBe('applied');
    const profile = await CaregiverProfile.findOne({ userId: response.body.data.userId }).select(
      '+verification.cnicNumber',
    );
    expect(profile.verification.cnicNumber).not.toBe('1234567890123');
  });

  it('verifies a valid email token and rejects a reused token', async () => {
    const user = await createVerifiedUser({ emailVerifiedAt: null });
    const token = await createToken(user, AUTH_TOKEN_TYPES.EMAIL_VERIFICATION);

    expect((await request(app).post('/api/v1/auth/verify-email').send({ token })).body).toEqual({
      success: true,
      data: { verified: true },
    });
    const reused = await request(app).post('/api/v1/auth/verify-email').send({ token });
    expect(reused.status).toBe(410);
    expect(reused.body.error.code).toBe('STATE_INVALID');
  });

  it('returns generic success when verification is resent for unknown or verified addresses', async () => {
    const user = await createVerifiedUser();
    const unknown = await request(app)
      .post('/api/v1/auth/resend-verification')
      .send({ email: 'unknown@example.com' });
    const verified = await request(app)
      .post('/api/v1/auth/resend-verification')
      .send({ email: user.email });

    expect(unknown.status).toBe(200);
    expect(verified.body).toEqual(unknown.body);
  });

  it('returns an identical 401 response for unknown, incorrect-password, and unverified login', async () => {
    await createVerifiedUser();
    await createVerifiedUser({ email: 'unverified@example.com', emailVerifiedAt: null });
    const unknown = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'unknown@example.com', password: PASSWORD });
    const wrongPassword = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'verified@example.com', password: 'wrongPass123' });
    const unverified = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'unverified@example.com', password: PASSWORD });

    expect(unknown.status).toBe(401);
    expect(wrongPassword.body.error.code).toBe('UNAUTHENTICATED');
    expect(unverified.body.error.message).toBe(unknown.body.error.message);
    expect(unverified.body.error.code).toBe(unknown.body.error.code);
  });

  it('logs in, rotates refresh tokens, and logs out', async () => {
    const user = await createVerifiedUser();
    const login = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: user.email, password: PASSWORD });
    const accessToken = login.body.data.accessToken;
    const firstCookie = refreshCookie(login);
    const refresh = await request(app).post('/api/v1/auth/refresh').set('Cookie', firstCookie);
    const secondCookie = refreshCookie(refresh);
    const logout = await request(app)
      .post('/api/v1/auth/logout')
      .set('Authorization', `Bearer ${accessToken}`)
      .set('Cookie', secondCookie);
    const reused = await request(app).post('/api/v1/auth/refresh').set('Cookie', secondCookie);

    expect(login.status).toBe(200);
    expect(refresh.status).toBe(200);
    expect(secondCookie).not.toBe(firstCookie);
    expect(logout.status).toBe(200);
    expect(reused.status).toBe(401);
  });

  it('sets a local-development refresh cookie that restores a full-page session', async () => {
    const user = await createVerifiedUser({ email: 'reload@example.com' });
    const login = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: user.email, password: PASSWORD });
    const refresh = await request(app)
      .post('/api/v1/auth/refresh')
      .set('Cookie', refreshCookie(login));

    expect(login.headers['set-cookie'][0]).toContain('HttpOnly');
    expect(login.headers['set-cookie'][0]).not.toContain('Secure');
    expect(refresh.status).toBe(200);
    expect(refresh.body.data.accessToken).toEqual(expect.any(String));
    expect(refresh.body.data.user).toMatchObject({
      id: user._id.toString(),
      name: user.name,
      role: 'client',
      status: 'active',
    });
  });

  it('restores the role-specific user record needed by every portal after a refresh', async () => {
    const caregiver = await createVerifiedUser({
      email: 'refresh-caregiver@example.com',
      role: 'caregiver',
    });
    await CaregiverProfile.create({
      userId: caregiver._id,
      verification: { cnicNumber: 'test-only-placeholder', gates: {} },
      serviceArea: { type: 'Point', coordinates: [73.0479, 33.6844], radiusKm: 10 },
      status: 'verified',
    });
    const admin = await createVerifiedUser({
      email: 'refresh-admin@example.com',
      role: 'admin',
    });

    for (const expected of [
      { email: caregiver.email, role: 'caregiver', status: 'verified' },
      { email: admin.email, role: 'admin', status: 'active' },
    ]) {
      const login = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: expected.email, password: PASSWORD });
      const refresh = await request(app)
        .post('/api/v1/auth/refresh')
        .set('Cookie', refreshCookie(login));

      expect(refresh.status).toBe(200);
      expect(refresh.body.data.user).toMatchObject({
        role: expected.role,
        status: expected.status,
      });
    }
  });

  it('returns the caregiver verification status at login for role-based portal routing', async () => {
    const caregiver = await createVerifiedUser({
      role: 'caregiver',
      email: 'bilal-caregiver@example.com',
    });
    await CaregiverProfile.create({
      userId: caregiver._id,
      verification: { cnicNumber: 'test-only-placeholder', gates: {} },
      serviceArea: { type: 'Point', coordinates: [73.0479, 33.6844], radiusKm: 10 },
      status: 'verified',
    });

    const login = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: caregiver.email, password: PASSWORD });

    expect(login.status).toBe(200);
    expect(login.body.data.user).toMatchObject({ role: 'caregiver', status: 'verified' });
  });

  it('does not reveal whether password-reset email exists and resets a valid token once', async () => {
    const user = await createVerifiedUser();
    const known = await request(app).post('/api/v1/auth/forgot').send({ email: user.email });
    const unknown = await request(app)
      .post('/api/v1/auth/forgot')
      .send({ email: 'unknown@example.com' });
    const token = await createToken(user, AUTH_TOKEN_TYPES.PASSWORD_RESET);
    const reset = await request(app)
      .post('/api/v1/auth/reset')
      .send({ token, newPassword: 'newPass123' });
    const reused = await request(app)
      .post('/api/v1/auth/reset')
      .send({ token, newPassword: 'newPass123' });

    expect(known.body).toEqual(unknown.body);
    expect(reset.status).toBe(200);
    expect(reused.status).toBe(410);
    const login = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: user.email, password: 'newPass123' });
    expect(login.status).toBe(200);
  });
});
