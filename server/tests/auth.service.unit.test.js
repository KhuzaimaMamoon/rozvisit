import { afterAll, beforeAll, beforeEach, describe, expect, it, jest } from '@jest/globals';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { AuthToken } from '../src/models/AuthToken.js';
import { ClientProfile } from '../src/models/ClientProfile.js';
import { RefreshToken } from '../src/models/RefreshToken.js';
import { User } from '../src/models/User.js';
import { authService, deliverAuthEmail } from '../src/services/auth.service.js';

describe('authService', () => {
  let mongo;

  beforeAll(async () => {
    mongo = await MongoMemoryServer.create();
    await mongoose.connect(mongo.getUri());
  });

  beforeEach(async () => {
    await Promise.all([
      User.deleteMany({}),
      ClientProfile.deleteMany({}),
      AuthToken.deleteMany({}),
      RefreshToken.deleteMany({}),
    ]);
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongo.stop();
  });

  it('creates the client account, country-derived profile currency, and hashed verification token', async () => {
    const result = await authService.register({
      name: 'Ayesha Khan',
      email: 'ayesha@example.com',
      phone: '+971501234567',
      countryCode: 'AE',
      password: 'safePass123',
    });

    const user = await User.findById(result.userId);
    const profile = await ClientProfile.findOne({ userId: user._id });
    const token = await AuthToken.findOne({ userId: user._id }).select('+tokenHash');

    expect(user.passwordHash).toBeUndefined();
    expect(profile.currency).toBe('AED');
    expect(token.tokenHash).toMatch(/^[a-f0-9]{64}$/);
    expect(token.usedAt).toBeNull();
  });

  it('contains provider delivery failures and schedules an internal retry', async () => {
    const scheduleRetry = jest.fn();
    const log = { error: jest.fn() };
    const rejection = Object.assign(
      new Error('Brevo email delivery failed: sender is unverified'),
      {
        code: 'validation_error',
        name: 'validation_error',
        providerDetails: {
          code: 'validation_error',
          message: 'sender is unverified',
          name: 'validation_error',
          statusCode: 403,
        },
        responseCode: 403,
        statusCode: 403,
      },
    );
    const channel = { send: jest.fn().mockRejectedValue(rejection) };

    await expect(
      deliverAuthEmail(
        { link: 'http://localhost:5173/verify?token=single-use-token', type: 'email_verification' },
        { channel, log, scheduleRetry },
      ),
    ).resolves.toEqual({ sent: false });

    expect(scheduleRetry).toHaveBeenCalledWith(expect.any(Object), 1);
    expect(log.error).toHaveBeenCalledWith(
      'auth.email_delivery_failed',
      expect.objectContaining({
        errorCode: 'validation_error',
        errorMessage: 'Brevo email delivery failed: sender is unverified',
        errorName: 'validation_error',
        provider: 'brevo',
        responseCode: 403,
        statusCode: 403,
        type: 'email_verification',
      }),
    );
  });
});
