import { execFile } from 'node:child_process';
import path from 'node:path';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from '@jest/globals';
import mongoose from 'mongoose';
import { MongoMemoryReplSet } from 'mongodb-memory-server';
import { ROLES, USER_STATUS } from '../src/config/constants.js';
import { AuditEvent } from '../src/models/AuditEvent.js';
import { User } from '../src/models/User.js';

const execFileAsync = promisify(execFile);
const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const scriptPath = path.join(repoRoot, 'scripts/delete-admin.js');

function userData(email, role = ROLES.ADMIN) {
  return {
    email,
    emailVerifiedAt: new Date(),
    name: email.split('@')[0].replaceAll('-', ' '),
    passwordHash: 'test-hash',
    phone: '+923001234567',
    role,
    status: USER_STATUS.ACTIVE,
  };
}

describe('delete-admin script', () => {
  let mongo;
  let scriptEnv;

  beforeAll(async () => {
    mongo = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
    const mongoUri = mongo.getUri();
    await mongoose.connect(mongoUri);
    scriptEnv = {
      ...process.env,
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

  beforeEach(async () => {
    await Promise.all([User.deleteMany({}), AuditEvent.deleteMany({})]);
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongo?.stop();
  });

  it('deletes only the named admin and records the surviving admin as audit actor', async () => {
    const [actor, target, client] = await User.create([
      userData('real-admin@example.com'),
      userData('obsolete-admin@example.com'),
      userData('preserved-client@example.com', ROLES.CLIENT),
    ]);

    const result = await execFileAsync(process.execPath, [scriptPath, target.email], {
      cwd: repoRoot,
      env: scriptEnv,
    });

    expect(result.stdout).toContain(`Deleted admin account ${target.email}`);
    expect(await User.exists({ _id: target._id })).toBeNull();
    expect(await User.exists({ _id: actor._id })).not.toBeNull();
    expect(await User.exists({ _id: client._id })).not.toBeNull();
    expect(await AuditEvent.findOne({ action: 'admin.deleted' })).toMatchObject({
      actorId: actor._id,
      detail: {
        source: 'scripts/delete-admin.js',
        targetEmail: target.email,
        targetName: target.name,
      },
      targetId: target._id,
      targetType: 'user',
    });
  }, 30_000);

  it('refuses to delete the last admin and writes no audit event', async () => {
    const onlyAdmin = await User.create(userData('only-admin@example.com'));

    await expect(
      execFileAsync(process.execPath, [scriptPath, onlyAdmin.email], {
        cwd: repoRoot,
        env: scriptEnv,
      }),
    ).rejects.toMatchObject({
      stderr: expect.stringContaining('Refusing to delete the last admin account.'),
    });

    expect(await User.exists({ _id: onlyAdmin._id })).not.toBeNull();
    expect(await AuditEvent.countDocuments()).toBe(0);
  });

  it('refuses to delete a non-admin account', async () => {
    await User.create([
      userData('first-admin@example.com'),
      userData('second-admin@example.com'),
      userData('client@example.com', ROLES.CLIENT),
    ]);

    await expect(
      execFileAsync(process.execPath, [scriptPath, 'client@example.com'], {
        cwd: repoRoot,
        env: { ...scriptEnv, ACTOR_ADMIN_EMAIL: 'first-admin@example.com' },
      }),
    ).rejects.toMatchObject({
      stderr: expect.stringContaining('the account is not an admin'),
    });

    expect(await User.exists({ email: 'client@example.com' })).not.toBeNull();
    expect(await AuditEvent.countDocuments()).toBe(0);
  });
});
