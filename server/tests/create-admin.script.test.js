import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { afterAll, afterEach, beforeAll, describe, expect, it } from '@jest/globals';
import bcrypt from 'bcrypt';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { ADMIN_PERMISSIONS, ROLES, USER_STATUS } from '../src/config/constants.js';
import { User } from '../src/models/User.js';

const execFileAsync = promisify(execFile);
const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const scriptPath = path.join(repoRoot, 'scripts/create-admin.js');
const throwawayEmail = 'throwaway-production-admin@example.com';
const throwawayPassword = 'throwawayPass123';

describe('create-admin script', () => {
  let mongo;
  let scriptEnv;

  beforeAll(async () => {
    mongo = await MongoMemoryServer.create();
    const mongoUri = mongo.getUri();
    await mongoose.connect(mongoUri);

    scriptEnv = {
      ...process.env,
      ADMIN_EMAIL: throwawayEmail,
      ADMIN_NAME: 'Throwaway Production Admin',
      ADMIN_PASSWORD: throwawayPassword,
      ADMIN_PHONE: '+923001112233',
      APP_BASE_URL: 'https://rozvisit-client.vercel.app',
      CLOUDINARY_API_KEY: '123456789',
      CLOUDINARY_API_SECRET: 'test-cloudinary-secret',
      CLOUDINARY_CLOUD_NAME: 'test-cloud',
      EMAIL_FROM_ADDRESS: 'admin@example.com',
      FIELD_ENCRYPTION_KEY: Buffer.alloc(32, 1).toString('base64'),
      FIREBASE_SERVICE_ACCOUNT_JSON: JSON.stringify({
        client_email: 'firebase@example.com',
        private_key: 'test-private-key',
        project_id: 'test-project',
      }),
      JWT_ACCESS_SECRET: 'test-access-secret-that-is-long-enough-123',
      JWT_REFRESH_SECRET: 'test-refresh-secret-that-is-different-456',
      MONGO_URI: mongoUri,
      NODE_ENV: 'production',
    };
  }, 30_000);

  afterEach(async () => {
    if (mongoose.connection.readyState === 1) {
      await User.deleteOne({ email: throwawayEmail });
    }
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongo?.stop();
  });

  it('creates, protects, and removes a throwaway production admin safely', async () => {
    const firstRun = await execFileAsync(process.execPath, [scriptPath], {
      cwd: repoRoot,
      env: scriptEnv,
    });

    expect(firstRun.stdout).toContain(`Created verified admin account for ${throwawayEmail}`);
    expect(firstRun.stdout).not.toContain(throwawayPassword);
    expect(firstRun.stderr).not.toContain(throwawayPassword);

    const created = await User.findOne({ email: throwawayEmail }).select('+passwordHash');
    expect(created).toMatchObject({
      email: throwawayEmail,
      name: 'Throwaway Production Admin',
      phone: '+923001112233',
      role: ROLES.ADMIN,
      status: USER_STATUS.ACTIVE,
    });
    expect(created.emailVerifiedAt).toBeInstanceOf(Date);
    expect(new Set(created.permissions)).toEqual(new Set(Object.values(ADMIN_PERMISSIONS)));
    expect(await bcrypt.compare(throwawayPassword, created.passwordHash)).toBe(true);

    await expect(
      execFileAsync(process.execPath, [scriptPath], { cwd: repoRoot, env: scriptEnv }),
    ).rejects.toMatchObject({
      stderr: expect.stringContaining(
        `Refusing to create an account because ${throwawayEmail} already exists.`,
      ),
    });
    expect(await User.countDocuments({ email: throwawayEmail })).toBe(1);

    await User.deleteOne({ email: throwawayEmail });
    expect(await User.exists({ email: throwawayEmail })).toBeNull();
  });
});
