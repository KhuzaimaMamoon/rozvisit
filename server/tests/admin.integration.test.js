import { afterAll, beforeAll, beforeEach, describe, expect, it } from '@jest/globals';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';
import { createApp } from '../src/app.js';
import {
  ADMIN_PERMISSIONS,
  CAREGIVER_STATUS,
  ROLES,
  USER_STATUS,
} from '../src/config/constants.js';
import { env } from '../src/config/env.js';
import { AuditEvent } from '../src/models/AuditEvent.js';
import { CaregiverProfile } from '../src/models/CaregiverProfile.js';
import { User } from '../src/models/User.js';
import { encrypt } from '../src/utils/crypto.js';

describe('Admin verification API', () => {
  let app;
  let application;
  let admin;
  let mongo;

  beforeAll(async () => {
    mongo = await MongoMemoryServer.create();
    await mongoose.connect(mongo.getUri());
    app = createApp();
  });

  beforeEach(async () => {
    await Promise.all([
      AuditEvent.deleteMany({}),
      CaregiverProfile.deleteMany({}),
      User.deleteMany({}),
    ]);
    admin = await User.create({
      email: 'nasreen@admin.test',
      name: 'Nasreen Shah',
      passwordHash: 'hash',
      permissions: Object.values(ADMIN_PERMISSIONS),
      phone: '+923001234568',
      role: ROLES.ADMIN,
      status: USER_STATUS.ACTIVE,
    });
    const applicant = await User.create({
      email: 'bilal@admin.test',
      name: 'Bilal Ahmed',
      passwordHash: 'hash',
      phone: '+923001234567',
      role: ROLES.CAREGIVER,
      status: USER_STATUS.ACTIVE,
    });
    application = await CaregiverProfile.create({
      userId: applicant._id,
      verification: { cnicNumber: encrypt('35202-1234567-1'), gates: {} },
      serviceArea: { type: 'Point', coordinates: [73.0479, 33.5651], radiusKm: 12 },
      status: CAREGIVER_STATUS.APPLIED,
    });
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongo.stop();
  });

  function auth(user) {
    return {
      Authorization: `Bearer ${jwt.sign({ role: user.role }, env.jwt.accessSecret, {
        expiresIn: '15m',
        subject: user._id.toString(),
      })}`,
    };
  }

  it('records each verification gate, audits sensitive access, and verifies only after all gates pass', async () => {
    const queue = await request(app).get('/api/v1/admin/applications').set(auth(admin));
    expect(queue.status).toBe(200);
    expect(queue.body.data.items[0]).toMatchObject({
      id: application._id.toString(),
      gates: { cnic: false, interview: false, reference: false },
    });
    expect(queue.body.data.items[0].verification).toBeUndefined();

    const detail = await request(app)
      .get(`/api/v1/admin/applications/${application._id}`)
      .set(auth(admin));
    expect(detail.status).toBe(200);
    expect(detail.body.data.verification.cnicNumber).toBe('35202-1234567-1');
    expect(await AuditEvent.countDocuments({ action: 'cnic.viewed' })).toBe(1);

    const premature = await request(app)
      .post(`/api/v1/admin/applications/${application._id}/decision`)
      .set(auth(admin))
      .send({ decision: 'approve' });
    expect(premature.status).toBe(409);
    expect(premature.body.error.message).toBe('Verification gates incomplete');

    const cnic = await request(app)
      .patch(`/api/v1/admin/applications/${application._id}/cnic-gate`)
      .set(auth(admin))
      .send({ cnicDocRef: 'rozvisit/applications/bilal/cnic', verified: true });
    expect(cnic.status).toBe(200);
    expect(cnic.body.data.gates.cnic).toBe(true);

    const interview = await request(app)
      .patch(`/api/v1/admin/applications/${application._id}/interview-gate`)
      .set(auth(admin))
      .send({ passed: true });
    expect(interview.status).toBe(200);
    expect(interview.body.data.gates.interview).toBe(true);

    const negativeReference = await request(app)
      .patch(`/api/v1/admin/applications/${application._id}/reference-gate`)
      .set(auth(admin))
      .send({
        note: 'Reference was unavailable after two calls.',
        referenceOutcome: 'unreachable',
      });
    expect(negativeReference.status).toBe(200);
    expect(negativeReference.body.data.gates.reference).toBe(false);

    const reference = await request(app)
      .patch(`/api/v1/admin/applications/${application._id}/reference-gate`)
      .set(auth(admin))
      .send({ referenceOutcome: 'positive' });
    expect(reference.status).toBe(200);
    expect(reference.body.data.gates.reference).toBe(true);

    const approved = await request(app)
      .post(`/api/v1/admin/applications/${application._id}/decision`)
      .set(auth(admin))
      .send({ decision: 'approve', note: 'All checks complete.' });
    expect(approved.status).toBe(200);
    expect(approved.body.data.status).toBe(CAREGIVER_STATUS.VERIFIED);
    expect(await AuditEvent.countDocuments({ targetId: application._id })).toBe(6);
  });

  it('refuses application review for an admin without the scoped permission', async () => {
    const limitedAdmin = await User.create({
      email: 'limited@admin.test',
      name: 'Limited Admin',
      passwordHash: 'hash',
      permissions: [],
      phone: '+923001234569',
      role: ROLES.ADMIN,
      status: USER_STATUS.ACTIVE,
    });
    const response = await request(app).get('/api/v1/admin/applications').set(auth(limitedAdmin));
    expect(response.status).toBe(403);
  });
});
