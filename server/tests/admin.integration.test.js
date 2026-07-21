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
import { ClientProfile } from '../src/models/ClientProfile.js';
import { ParentProfile } from '../src/models/ParentProfile.js';
import { Notification } from '../src/models/Notification.js';
import { Subscription } from '../src/models/Subscription.js';
import { User } from '../src/models/User.js';
import { Visit } from '../src/models/Visit.js';
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
      ClientProfile.deleteMany({}),
      Notification.deleteMany({}),
      ParentProfile.deleteMany({}),
      Subscription.deleteMany({}),
      User.deleteMany({}),
      Visit.deleteMany({}),
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

  it('orders continuity and in-area assignment suggestions by today load, then audits assignment', async () => {
    const client = await User.create({
      email: 'ayesha@admin.test',
      name: 'Ayesha Khan',
      passwordHash: 'hash',
      phone: '+971501234567',
      role: ROLES.CLIENT,
      status: USER_STATUS.ACTIVE,
    });
    const [previousUser, lowLoadUser, highLoadUser] = await User.create([
      {
        email: 'previous@admin.test',
        name: 'Zara Previous',
        passwordHash: 'hash',
        phone: '+923001234561',
        role: ROLES.CAREGIVER,
        status: USER_STATUS.ACTIVE,
      },
      {
        email: 'low@admin.test',
        name: 'Adam Low',
        passwordHash: 'hash',
        phone: '+923001234562',
        role: ROLES.CAREGIVER,
        status: USER_STATUS.ACTIVE,
      },
      {
        email: 'high@admin.test',
        name: 'Mary High',
        passwordHash: 'hash',
        phone: '+923001234563',
        role: ROLES.CAREGIVER,
        status: USER_STATUS.ACTIVE,
      },
    ]);
    await CaregiverProfile.create(
      [previousUser, lowLoadUser, highLoadUser].map((user) => ({
        userId: user._id,
        verification: {
          cnicNumber: 'encrypted',
          gates: { cnic: true, interview: true, reference: true },
        },
        serviceArea: { type: 'Point', coordinates: [73, 33], radiusKm: 12 },
        status: CAREGIVER_STATUS.VERIFIED,
      })),
    );
    const parent = await ParentProfile.create({
      clientId: client._id,
      name: 'Amina Bibi',
      age: 68,
      addressText: encrypt('Rawalpindi'),
      location: { type: 'Point', coordinates: [73, 33] },
      emergencyContacts: [
        { name: 'Ayesha', phone: '+971501234567', relation: 'Daughter', priority: 1 },
      ],
    });
    const subscription = await Subscription.create({
      clientId: client._id,
      parentId: parent._id,
      planKey: 'Standard',
      planSnapshot: { visitsPerWeek: 3, errandsPerWeek: 1, price: 195, currency: 'AED' },
      state: 'active',
      stateHistory: [{ state: 'active', at: new Date() }],
    });
    const target = await Visit.create({
      clientVisitId: 'admin-target',
      parentId: parent._id,
      subscriptionId: subscription._id,
      scheduledAt: new Date(),
      status: 'scheduled',
      statusHistory: [{ status: 'scheduled', at: new Date() }],
    });
    await Visit.create({
      clientVisitId: 'admin-previous',
      parentId: parent._id,
      caregiverId: previousUser._id,
      subscriptionId: subscription._id,
      scheduledAt: new Date(Date.now() - 86400000),
      status: 'completed',
      statusHistory: [{ status: 'completed', at: new Date() }],
    });
    await Visit.create([
      {
        clientVisitId: 'admin-high-one',
        parentId: parent._id,
        caregiverId: highLoadUser._id,
        subscriptionId: subscription._id,
        scheduledAt: new Date(),
        status: 'scheduled',
        statusHistory: [{ status: 'scheduled', at: new Date() }],
      },
      {
        clientVisitId: 'admin-high-two',
        parentId: parent._id,
        caregiverId: highLoadUser._id,
        subscriptionId: subscription._id,
        scheduledAt: new Date(),
        status: 'scheduled',
        statusHistory: [{ status: 'scheduled', at: new Date() }],
      },
    ]);

    const suggestions = await request(app)
      .get(`/api/v1/admin/visits/${target._id}/assignment-suggestions`)
      .set(auth(admin));
    expect(suggestions.status).toBe(200);
    expect(suggestions.body.data.items.map((item) => item.caregiverId)).toEqual([
      previousUser._id.toString(),
      lowLoadUser._id.toString(),
      highLoadUser._id.toString(),
    ]);
    expect(suggestions.body.data.items[1].todayScheduledCount).toBe(0);
    expect(suggestions.body.data.items[2].todayScheduledCount).toBe(2);

    const assigned = await request(app)
      .post(`/api/v1/admin/visits/${target._id}/assign`)
      .set(auth(admin))
      .send({ caregiverId: lowLoadUser._id.toString() });
    expect(assigned.status).toBe(200);
    expect(assigned.body.data.caregiver.name).toBe('Adam Low');
    expect(
      await AuditEvent.countDocuments({ action: 'visit.assigned', targetId: target._id }),
    ).toBe(1);
  });

  it('filters oversight visits, returns evidence, and restores a resolved flag with an audit event', async () => {
    const client = await User.create({
      email: 'client2@admin.test',
      name: 'Ayesha Khan',
      passwordHash: 'hash',
      phone: '+971501234566',
      role: ROLES.CLIENT,
      status: USER_STATUS.ACTIVE,
    });
    const parent = await ParentProfile.create({
      clientId: client._id,
      name: 'Amina Bibi',
      age: 68,
      addressText: encrypt('Rawalpindi'),
      location: { type: 'Point', coordinates: [73, 33] },
      emergencyContacts: [
        { name: 'Ayesha', phone: '+971501234567', relation: 'Daughter', priority: 1 },
      ],
    });
    const subscription = await Subscription.create({
      clientId: client._id,
      parentId: parent._id,
      planKey: 'Standard',
      planSnapshot: { visitsPerWeek: 3, errandsPerWeek: 1, price: 195, currency: 'AED' },
      state: 'active',
      stateHistory: [{ state: 'active', at: new Date() }],
    });
    const flagged = await Visit.create({
      clientVisitId: 'admin-flagged',
      parentId: parent._id,
      subscriptionId: subscription._id,
      scheduledAt: new Date(),
      status: 'flagged',
      statusBeforeFlag: 'completed',
      statusHistory: [
        { status: 'completed', at: new Date(Date.now() - 60000) },
        { status: 'flagged', at: new Date(), reason: 'UPLOAD_DELAYED' },
      ],
      checklist: {
        medicationTaken: true,
        mood: 4,
        concerns: [],
        capturedAt: new Date(),
        completedAt: new Date(),
      },
      media: [
        {
          clientMediaId: 'proof-one',
          ref: 'https://example.test/proof.jpg',
          capturedAt: new Date(Date.now() - 90000000),
          uploadedAt: new Date(),
          sourceFlag: 'in_app_camera',
        },
      ],
      flag: { reason: 'UPLOAD_DELAYED', raisedAt: new Date() },
    });
    const list = await request(app).get('/api/v1/admin/visits?status=flagged').set(auth(admin));
    expect(list.status).toBe(200);
    expect(list.body.data.items).toHaveLength(1);
    const evidence = await request(app).get(`/api/v1/admin/visits/${flagged._id}`).set(auth(admin));
    expect(evidence.status).toBe(200);
    expect(evidence.body.data.media[0].uploadedAt).toBeDefined();
    expect(await AuditEvent.countDocuments({ action: 'visit.viewed', targetId: flagged._id })).toBe(
      1,
    );
    const resolved = await request(app)
      .post(`/api/v1/admin/flags/${flagged._id}/resolve`)
      .set(auth(admin))
      .send({ note: 'Upload reviewed and evidence confirmed.' });
    expect(resolved.status).toBe(200);
    expect(resolved.body.data.status).toBe('completed');
    expect(resolved.body.data.flag.note).toBe('Upload reviewed and evidence confirmed.');
    expect(resolved.body.data.statusHistory.at(-1)).toMatchObject({
      status: 'completed',
      reason: 'flag_resolved',
    });
    expect(
      await AuditEvent.countDocuments({ action: 'visit.flag_resolved', targetId: flagged._id }),
    ).toBe(1);
  });

  it('marks a scheduled visit missed, preserves the honest update, audits it, and notifies the client', async () => {
    const client = await User.create({
      email: 'client-missed@admin.test',
      name: 'Ayesha Khan',
      passwordHash: 'hash',
      phone: '+971501234565',
      role: ROLES.CLIENT,
      status: USER_STATUS.ACTIVE,
    });
    const parent = await ParentProfile.create({
      clientId: client._id,
      name: 'Amina Bibi',
      age: 68,
      addressText: encrypt('Rawalpindi'),
      location: { type: 'Point', coordinates: [73, 33] },
      emergencyContacts: [
        { name: 'Ayesha', phone: '+971501234567', relation: 'Daughter', priority: 1 },
      ],
    });
    const subscription = await Subscription.create({
      clientId: client._id,
      parentId: parent._id,
      planKey: 'Standard',
      planSnapshot: { visitsPerWeek: 3, errandsPerWeek: 1, price: 195, currency: 'AED' },
      state: 'active',
      stateHistory: [{ state: 'active', at: new Date() }],
    });
    const visit = await Visit.create({
      clientVisitId: 'admin-missed',
      parentId: parent._id,
      subscriptionId: subscription._id,
      scheduledAt: new Date(),
      status: 'scheduled',
      statusHistory: [{ status: 'scheduled', at: new Date() }],
    });

    const reason = 'Caregiver was unable to reach the area due to weather.';
    const makeUpPlan = 'Rescheduled for tomorrow at the same time.';
    const marked = await request(app)
      .post(`/api/v1/admin/visits/${visit._id}/mark-missed`)
      .set(auth(admin))
      .send({ makeUpPlan, reason });

    expect(marked.status).toBe(200);
    expect(marked.body.data).toMatchObject({ makeUpPlan, status: 'missed' });
    expect(marked.body.data.statusHistory.at(-1)).toMatchObject({ reason, status: 'missed' });
    expect(
      await AuditEvent.countDocuments({ action: 'visit.marked_missed', targetId: visit._id }),
    ).toBe(1);
    expect(await Notification.findOne({ type: 'visit_missed', userId: client._id })).toMatchObject({
      body: "Today's visit with Amina Bibi did not happen. We are looking into it.",
    });

    const feed = await request(app).get(`/api/v1/feed?parentId=${parent._id}`).set(auth(client));
    expect(feed.status).toBe(200);
    expect(feed.body.data.items[0]).toMatchObject({
      makeUpPlan,
      missedReason: reason,
      status: 'missed',
    });

    const repeated = await request(app)
      .post(`/api/v1/admin/visits/${visit._id}/mark-missed`)
      .set(auth(admin))
      .send({ reason });
    expect(repeated.status).toBe(409);
    expect(repeated.body.error.code).toBe('STATE_INVALID');
  });

  it('lists non-sensitive caregiver and client directories and audits an explicit CNIC reveal', async () => {
    const client = await User.create({
      email: 'directory-client@admin.test',
      name: 'Ayesha Directory',
      passwordHash: 'hash',
      phone: '+971501234566',
      role: ROLES.CLIENT,
      status: USER_STATUS.ACTIVE,
    });
    await ClientProfile.create({ userId: client._id, countryCode: 'AE', currency: 'AED' });
    const parent = await ParentProfile.create({
      clientId: client._id,
      name: 'Amina Directory',
      age: 68,
      addressText: encrypt('Rawalpindi address'),
      location: { type: 'Point', coordinates: [73, 33] },
      emergencyContacts: [
        { name: 'Ayesha', phone: '+971501234566', relation: 'Daughter', priority: 1 },
      ],
    });
    await Subscription.create({
      clientId: client._id,
      parentId: parent._id,
      planKey: 'Standard',
      planSnapshot: { visitsPerWeek: 3, errandsPerWeek: 1, price: 195, currency: 'AED' },
      state: 'active',
      stateHistory: [{ state: 'active', at: new Date() }],
    });

    const caregivers = await request(app).get('/api/v1/admin/caregivers').set(auth(admin));
    expect(caregivers.status).toBe(200);
    expect(caregivers.body.data.items[0]).toMatchObject({
      id: application._id.toString(),
      user: { email: 'bilal@admin.test', name: 'Bilal Ahmed', phone: '+923001234567' },
    });
    expect(caregivers.body.data.items[0].verification.cnicNumber).toBeUndefined();

    const cnic = await request(app)
      .get(`/api/v1/admin/caregivers/${application._id}/cnic`)
      .set(auth(admin));
    expect(cnic.status).toBe(200);
    expect(cnic.body.data.cnicNumber).toBe('35202-1234567-1');
    expect(
      await AuditEvent.countDocuments({
        action: 'cnic.viewed',
        targetId: application._id,
        'detail.source': 'caregiver_directory',
      }),
    ).toBe(1);

    const clients = await request(app).get('/api/v1/admin/clients').set(auth(admin));
    expect(clients.status).toBe(200);
    expect(clients.body.data.items[0]).toMatchObject({
      countryCode: 'AE',
      currency: 'AED',
      email: 'directory-client@admin.test',
      parents: [{ name: 'Amina Directory' }],
      subscriptions: [{ planKey: 'Standard', state: 'active' }],
    });

    const limitedAdmin = await User.create({
      email: 'directory-limited@admin.test',
      name: 'Directory Limited',
      passwordHash: 'hash',
      permissions: [ADMIN_PERMISSIONS.CAREGIVERS_DIRECTORY_VIEW],
      phone: '+923001234560',
      role: ROLES.ADMIN,
      status: USER_STATUS.ACTIVE,
    });
    const forbiddenCnic = await request(app)
      .get(`/api/v1/admin/caregivers/${application._id}/cnic`)
      .set(auth(limitedAdmin));
    expect(forbiddenCnic.status).toBe(403);
    const forbiddenClients = await request(app)
      .get('/api/v1/admin/clients')
      .set(auth(limitedAdmin));
    expect(forbiddenClients.status).toBe(403);
  });
});
