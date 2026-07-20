import { afterAll, beforeAll, beforeEach, describe, expect, it } from '@jest/globals';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import {
  ADMIN_PERMISSIONS,
  APPLICATION_DECISIONS,
  CAREGIVER_STATUS,
  ROLES,
  USER_STATUS,
} from '../src/config/constants.js';
import { AuditEvent } from '../src/models/AuditEvent.js';
import { CaregiverProfile } from '../src/models/CaregiverProfile.js';
import { User } from '../src/models/User.js';
import { adminService } from '../src/services/admin.service.js';
import { ConflictError } from '../src/utils/AppError.js';
import { encrypt } from '../src/utils/crypto.js';

describe('adminService', () => {
  let admin;
  let application;
  let mongo;

  beforeAll(async () => {
    mongo = await MongoMemoryServer.create();
    await mongoose.connect(mongo.getUri());
  });

  beforeEach(async () => {
    await Promise.all([
      AuditEvent.deleteMany({}),
      CaregiverProfile.deleteMany({}),
      User.deleteMany({}),
    ]);
    admin = await User.create({
      email: 'nasreen@service.test',
      name: 'Nasreen Shah',
      passwordHash: 'hash',
      permissions: Object.values(ADMIN_PERMISSIONS),
      phone: '+923001234568',
      role: ROLES.ADMIN,
      status: USER_STATUS.ACTIVE,
    });
    const applicant = await User.create({
      email: 'bilal@service.test',
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

  it('does not allow verification until all independently recorded gates pass', async () => {
    await expect(
      adminService.decideApplication(admin._id, application._id, {
        decision: APPLICATION_DECISIONS.APPROVE,
        note: null,
      }),
    ).rejects.toBeInstanceOf(ConflictError);

    await adminService.recordCnicGate(admin._id, application._id, {
      cnicDocRef: 'rozvisit/applications/bilal/cnic',
      note: null,
      verified: true,
    });
    await adminService.recordInterviewGate(admin._id, application._id, {
      interviewRecordingRef: null,
      note: null,
      passed: true,
    });
    await adminService.recordReferenceGate(admin._id, application._id, {
      note: null,
      referenceOutcome: 'positive',
    });
    const approved = await adminService.decideApplication(admin._id, application._id, {
      decision: APPLICATION_DECISIONS.APPROVE,
      note: null,
    });

    expect(approved.status).toBe(CAREGIVER_STATUS.VERIFIED);
    expect(approved.verification.gateRecords.reference.recordedBy).toBe(admin._id.toString());
  });
});
