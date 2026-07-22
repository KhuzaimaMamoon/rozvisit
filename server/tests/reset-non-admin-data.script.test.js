import { execFile } from 'node:child_process';
import path from 'node:path';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';
import { afterAll, beforeAll, describe, expect, it } from '@jest/globals';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { CarePlan } from '../src/models/CarePlan.js';
import { User } from '../src/models/User.js';
import { ADMIN_PERMISSIONS } from '../src/config/constants.js';

const execFileAsync = promisify(execFile);
const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const scriptPath = path.join(repoRoot, 'scripts/reset-non-admin-data.js');

describe('reset-non-admin-data script', () => {
  let mongo;
  let scriptEnv;

  beforeAll(async () => {
    mongo = await MongoMemoryServer.create();
    const mongoUri = mongo.getUri();
    await mongoose.connect(mongoUri);
    scriptEnv = {
      ...process.env,
      APP_BASE_URL: 'https://rozvisit-client.vercel.app',
      CLOUDINARY_API_KEY: '123456789',
      CLOUDINARY_API_SECRET: 'test-cloudinary-secret',
      CLOUDINARY_CLOUD_NAME: 'test-cloud',
      CONFIRM_RESET_NON_ADMIN_DATA: 'DELETE_ALL_NON_ADMIN_DATA',
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

  afterAll(async () => {
    await mongoose.disconnect();
    await mongo?.stop();
  });

  it('preserves only admins and care plans while removing orphan collections', async () => {
    await User.create([
      {
        email: 'preserved-admin@example.com',
        name: 'Preserved Admin',
        passwordHash: 'hash',
        phone: '+923001234567',
        role: 'admin',
        status: 'active',
      },
      {
        email: 'removed-client@example.com',
        name: 'Removed Client',
        passwordHash: 'hash',
        phone: '+971501234567',
        role: 'client',
        status: 'active',
      },
    ]);
    await CarePlan.create({
      key: 'Basic',
      visitsPerWeek: 1,
      errandsPerWeek: 0,
      prices: {
        AED: { min: 90, max: 130 },
        GBP: { min: 20, max: 28 },
        SAR: { min: 95, max: 135 },
        USD: { min: 25, max: 35 },
      },
    });
    await mongoose.connection.db.collection('orphanedTestRecords').insertOne({ stale: true });

    const result = await execFileAsync(process.execPath, [scriptPath], {
      cwd: repoRoot,
      env: scriptEnv,
    });

    expect(result.stdout).toContain('preserved 1 admin user(s) and 1 care plan(s)');
    expect(await User.countDocuments({ role: 'admin' })).toBe(1);
    expect(new Set((await User.findOne({ role: 'admin' })).permissions)).toEqual(
      new Set(Object.values(ADMIN_PERMISSIONS)),
    );
    expect(await User.countDocuments({ role: { $ne: 'admin' } })).toBe(0);
    expect(await CarePlan.countDocuments()).toBe(1);
    expect(await mongoose.connection.db.collection('orphanedTestRecords').countDocuments()).toBe(0);
  }, 30_000);

  it('refuses to run without the exact destructive confirmation', async () => {
    const envWithoutConfirmation = { ...scriptEnv };
    delete envWithoutConfirmation.CONFIRM_RESET_NON_ADMIN_DATA;
    await expect(
      execFileAsync(process.execPath, [scriptPath], {
        cwd: repoRoot,
        env: envWithoutConfirmation,
      }),
    ).rejects.toMatchObject({
      stderr: expect.stringContaining('Refusing to reset data'),
    });
  });
});
