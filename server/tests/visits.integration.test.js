import { afterAll, beforeAll, beforeEach, describe, expect, it } from '@jest/globals';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { env } from '../src/config/env.js';
import { ADMIN_PERMISSIONS } from '../src/config/constants.js';
import { CaregiverProfile } from '../src/models/CaregiverProfile.js';
import { ParentProfile } from '../src/models/ParentProfile.js';
import { Subscription } from '../src/models/Subscription.js';
import { User } from '../src/models/User.js';
import { Visit } from '../src/models/Visit.js';
import { encrypt } from '../src/utils/crypto.js';

describe('Visit API lifecycle', () => {
  let mongo;
  let app;
  let client;
  let caregiver;
  let admin;
  let parent;
  beforeAll(async () => {
    mongo = await MongoMemoryServer.create();
    await mongoose.connect(mongo.getUri());
    app = createApp();
  });
  beforeEach(async () => {
    await Promise.all([
      User.deleteMany({}),
      ParentProfile.deleteMany({}),
      Subscription.deleteMany({}),
      CaregiverProfile.deleteMany({}),
      Visit.deleteMany({}),
    ]);
    [client, caregiver, admin] = await User.create([
      {
        role: 'client',
        name: 'Ayesha Khan',
        email: 'ayesha@visit.test',
        phone: '+971501234567',
        passwordHash: 'hash',
        status: 'active',
      },
      {
        role: 'caregiver',
        name: 'Bilal Ahmed',
        email: 'bilal@visit.test',
        phone: '+923001234567',
        passwordHash: 'hash',
        status: 'active',
      },
      {
        role: 'admin',
        name: 'Nasreen Shah',
        email: 'admin@visit.test',
        phone: '+923001234568',
        passwordHash: 'hash',
        permissions: [ADMIN_PERMISSIONS.VISITS_OVERSEE],
        status: 'active',
      },
    ]);
    await CaregiverProfile.create({
      userId: caregiver._id,
      verification: {
        cnicNumber: 'encrypted',
        gates: { cnic: true, interview: true, reference: true },
      },
      serviceArea: { type: 'Point', coordinates: [73, 33], radiusKm: 10 },
      status: 'verified',
    });
    parent = await ParentProfile.create({
      clientId: client._id,
      name: 'Amina Bibi',
      age: 68,
      addressText: 'encrypted',
      location: { type: 'Point', coordinates: [73, 33] },
      emergencyContacts: [
        { name: 'Ayesha', phone: '+971501234567', relation: 'Daughter', priority: 1 },
      ],
    });
    await Subscription.create({
      clientId: client._id,
      parentId: parent._id,
      planKey: 'Standard',
      planSnapshot: { visitsPerWeek: 3, errandsPerWeek: 1, price: 200, currency: 'AED' },
      state: 'active',
      stateHistory: [{ state: 'active', at: new Date() }],
      currentPeriodEnd: new Date(Date.now() + 28 * 86400000),
    });
  });
  afterAll(async () => {
    await mongoose.disconnect();
    await mongo.stop();
  });
  const auth = (user) => ({
    Authorization: `Bearer ${jwt.sign({ role: user.role }, env.jwt.accessSecret, { subject: user._id.toString(), expiresIn: '15m' })}`,
  });

  it('enforces the full scheduling, assignment, consent, and checklist lifecycle', async () => {
    const scheduled = await request(app)
      .post('/api/v1/visits/schedule')
      .set(auth(client))
      .send({ parentId: parent._id.toString(), slots: [{ dayOfWeek: 2, time: '10:00' }] });
    expect(scheduled.status).toBe(201);
    const visitId = scheduled.body.data.items[0].id;
    const beforeAssignment = await request(app)
      .post(`/api/v1/visits/${visitId}/checklist`)
      .set(auth(caregiver))
      .send({ medicationTaken: true, mood: 4, concerns: [], capturedAt: new Date().toISOString() });
    expect(beforeAssignment.status).toBe(409);
    expect(beforeAssignment.body.error.code).toBe('STATE_INVALID');
    const assigned = await request(app)
      .post(`/api/v1/admin/visits/${visitId}/assign`)
      .set(auth(admin))
      .send({ caregiverId: caregiver._id.toString() });
    expect(assigned.status).toBe(200);
    expect(assigned.body.data.caregiverId).toBe(caregiver._id.toString());
    const consent = await request(app)
      .post(`/api/v1/parents/${parent._id}/consent`)
      .set(auth(caregiver))
      .send({
        state: 'given',
        recordingRef: 'rozvisit/consent/1',
        byVisitId: visitId,
        choices: { preferredTimes: ['Morning'], photoBoundaries: 'Living room only', other: '' },
      });
    expect(consent.status).toBe(200);
    expect(consent.body.data.parentStatus).toBe('active');
    const checklist = await request(app)
      .post(`/api/v1/visits/${visitId}/checklist`)
      .set(auth(caregiver))
      .send({
        medicationTaken: true,
        mood: 4,
        concerns: [],
        note: 'All well',
        capturedAt: new Date().toISOString(),
      });
    expect(checklist.status).toBe(200);
    expect(checklist.body.data.checklist.mood).toBe(4);
  });

  it('allows the today list only for a verified caregiver', async () => {
    const today = await request(app).get('/api/v1/visits/today').set(auth(caregiver));
    const unverified = await User.create({
      role: 'caregiver',
      name: 'Pending caregiver',
      email: 'pending@visit.test',
      phone: '+923001234569',
      passwordHash: 'hash',
      status: 'active',
    });
    await CaregiverProfile.create({
      userId: unverified._id,
      verification: { cnicNumber: 'encrypted', gates: {} },
      serviceArea: { type: 'Point', coordinates: [73.1, 33.1], radiusKm: 10 },
      status: 'applied',
    });
    const blocked = await request(app).get('/api/v1/visits/today').set(auth(unverified));

    expect(today.status).toBe(200);
    expect(blocked.status).toBe(403);
  });

  it('returns only the authenticated caregiver’s assigned visits, newest first, with a cursor', async () => {
    await ParentProfile.updateOne(
      { _id: parent._id },
      { $set: { addressText: encrypt('Rawalpindi') } },
    );
    const otherCaregiver = await User.create({
      role: 'caregiver',
      name: 'Other caregiver',
      email: 'other-caregiver@visit.test',
      phone: '+923001234570',
      passwordHash: 'hash',
      status: 'active',
    });
    const subscription = await Subscription.findOne();
    await Visit.create([
      {
        clientVisitId: 'my-older-visit',
        caregiverId: caregiver._id,
        parentId: parent._id,
        subscriptionId: subscription._id,
        scheduledAt: new Date('2026-07-19T10:00:00.000Z'),
        status: 'completed',
        statusHistory: [{ status: 'completed', at: new Date('2026-07-19T11:00:00.000Z') }],
      },
      {
        clientVisitId: 'my-newer-visit',
        caregiverId: caregiver._id,
        parentId: parent._id,
        subscriptionId: subscription._id,
        scheduledAt: new Date('2026-07-20T10:00:00.000Z'),
        status: 'scheduled',
        statusHistory: [{ status: 'scheduled', at: new Date('2026-07-20T10:00:00.000Z') }],
      },
      {
        clientVisitId: 'other-caregiver-visit',
        caregiverId: otherCaregiver._id,
        parentId: parent._id,
        subscriptionId: subscription._id,
        scheduledAt: new Date('2026-07-21T10:00:00.000Z'),
        status: 'scheduled',
        statusHistory: [{ status: 'scheduled', at: new Date('2026-07-21T10:00:00.000Z') }],
      },
    ]);

    const firstPage = await request(app).get('/api/v1/visits/mine?limit=1').set(auth(caregiver));

    expect(firstPage.status).toBe(200);
    expect(firstPage.body.data.items).toHaveLength(1);
    expect(firstPage.body.data.items[0]).toMatchObject({
      parentName: 'Amina Bibi',
      status: 'scheduled',
    });
    expect(firstPage.body.data.nextCursor).toBe('2026-07-20T10:00:00.000Z');

    const secondPage = await request(app)
      .get(
        `/api/v1/visits/mine?limit=1&before=${encodeURIComponent(firstPage.body.data.nextCursor)}`,
      )
      .set(auth(caregiver));
    expect(secondPage.status).toBe(200);
    expect(secondPage.body.data.items[0].status).toBe('completed');
    expect(secondPage.body.data.nextCursor).toBeNull();
  });

  it('returns caregiver-scoped S-24 context and a separate consent permit', async () => {
    await ParentProfile.updateOne(
      { _id: parent._id },
      {
        $set: {
          addressText: encrypt('Rawalpindi, Punjab'),
          'consent.choices.preferredTimes': ['Morning'],
          'consent.choices.photoBoundaries': encrypt('Living room only'),
        },
      },
    );
    const visit = await Visit.create({
      clientVisitId: 'context-visit',
      parentId: parent._id,
      caregiverId: caregiver._id,
      subscriptionId: (await Subscription.findOne())._id,
      scheduledAt: new Date(),
      standingNote: 'Please knock first.',
      status: 'scheduled',
      statusHistory: [{ status: 'scheduled', at: new Date(), byUserId: client._id }],
    });

    const today = await request(app).get('/api/v1/visits/today').set(auth(caregiver));
    expect(today.status).toBe(200);
    expect(today.body.data.items[0]).toMatchObject({
      id: visit._id.toString(),
      parentName: 'Amina Bibi',
      addressText: 'Rawalpindi, Punjab',
      location: { lng: 73, lat: 33 },
      consentState: 'pending',
      standingNote: 'Please knock first.',
    });
    expect(today.body.data.items[0].consentChoices).toEqual({
      preferredTimes: ['Morning'],
      photoBoundaries: 'Living room only',
      other: null,
    });

    const detail = await request(app).get(`/api/v1/visits/${visit._id}`).set(auth(caregiver));
    expect(detail.status).toBe(200);
    expect(detail.body.data.clientVisitId).toBe('context-visit');

    const permit = await request(app)
      .post(`/api/v1/parents/${parent._id}/consent-permit`)
      .set(auth(caregiver))
      .send({ byVisitId: visit._id.toString(), mediaType: 'audio' });
    expect(permit.status).toBe(200);
    expect(permit.body.data).toMatchObject({
      folder: `rozvisit/consent/${parent._id}/`,
      maxFileSize: 52428800,
      resourceType: 'auto',
      allowedFormats: ['mp3', 'm4a', 'wav', 'webm', 'mp4', 'mov'],
    });
  });

  it('locks a weekly cycle after it is scheduled', async () => {
    const body = {
      parentId: parent._id.toString(),
      slots: [{ dayOfWeek: 2, time: '10:00' }],
    };
    const first = await request(app).post('/api/v1/visits/schedule').set(auth(client)).send(body);
    const repeated = await request(app)
      .post('/api/v1/visits/schedule')
      .set(auth(client))
      .send(body);

    expect(first.status).toBe(201);
    expect(repeated.status).toBe(409);
    expect(repeated.body.error.code).toBe('SCHEDULING_LOCKED');
    expect(await Visit.countDocuments({ parentId: parent._id })).toBe(first.body.data.items.length);
  });

  it('returns client proof feed items newest first', async () => {
    const subscription = await Subscription.findOne();
    await Visit.create([
      {
        clientVisitId: 'older-proof',
        parentId: parent._id,
        subscriptionId: subscription._id,
        scheduledAt: new Date('2026-07-19T10:00:00.000Z'),
        status: 'completed',
        statusHistory: [{ status: 'completed', at: new Date('2026-07-19T11:00:00.000Z') }],
      },
      {
        clientVisitId: 'newer-proof',
        parentId: parent._id,
        subscriptionId: subscription._id,
        scheduledAt: new Date('2026-07-20T10:00:00.000Z'),
        status: 'completed',
        statusHistory: [{ status: 'completed', at: new Date('2026-07-20T11:00:00.000Z') }],
      },
    ]);

    const feed = await request(app).get(`/api/v1/feed?parentId=${parent._id}`).set(auth(client));

    expect(feed.status).toBe(200);
    expect(feed.body.data.items.map((item) => item.visitId)).toEqual([
      expect.any(String),
      expect.any(String),
    ]);
    expect(new Date(feed.body.data.items[0].scheduledAt)).toEqual(
      new Date('2026-07-20T10:00:00.000Z'),
    );
  });

  it('mints camera-only permits and completes an offline retry exactly once', async () => {
    const visit = await Visit.create({
      clientVisitId: 'offline-visit-1',
      parentId: parent._id,
      caregiverId: caregiver._id,
      subscriptionId: (await Subscription.findOne())._id,
      scheduledAt: new Date(),
      status: 'scheduled',
      statusHistory: [{ status: 'scheduled', at: new Date(), byUserId: client._id }],
      checklist: { medicationTaken: true, mood: 4, concerns: [], capturedAt: new Date() },
    });
    await ParentProfile.updateOne(
      { _id: parent._id },
      { $set: { 'consent.state': 'given', status: 'active' } },
    );
    const capturedAt = '2026-07-20T12:00:00.000Z';
    const permit = await request(app)
      .post(`/api/v1/visits/${visit._id}/media-permit`)
      .set(auth(caregiver))
      .send({
        items: [{ clientMediaId: 'device-photo-1', capturedAt, mediaType: 'photo' }],
      });
    expect(permit.status).toBe(200);
    expect(permit.body.data.permits[0]).toMatchObject({
      clientMediaId: 'device-photo-1',
      folder: `rozvisit/visits/${visit._id}/`,
      maxFileSize: 52428800,
      resourceType: 'auto',
    });
    const completion = {
      clientVisitId: 'offline-visit-1',
      completedAt: new Date().toISOString(),
      media: [
        {
          clientMediaId: 'device-photo-1',
          ref: 'https://res.cloudinary.com/test/image/upload/proof.jpg',
          capturedAt,
          uploadedAt: new Date().toISOString(),
          sourceFlag: 'in_app_camera',
        },
      ],
    };
    const first = await request(app)
      .post(`/api/v1/visits/${visit._id}/complete`)
      .set(auth(caregiver))
      .send(completion);
    const retry = await request(app)
      .post(`/api/v1/visits/${visit._id}/complete`)
      .set(auth(caregiver))
      .send(completion);
    expect(first.status).toBe(200);
    expect(first.body.data.status).toBe('completed');
    expect(retry.status).toBe(200);
    expect(
      retry.body.data.statusHistory.filter((item) => item.status === 'completed'),
    ).toHaveLength(1);

    const staleChecklistReplay = await request(app)
      .post(`/api/v1/visits/${visit._id}/checklist`)
      .set(auth(caregiver))
      .send({
        medicationTaken: false,
        mood: 1,
        concerns: [],
        capturedAt: new Date().toISOString(),
      });
    expect(staleChecklistReplay.status).toBe(409);
    expect(staleChecklistReplay.body.error.code).toBe('STATE_INVALID');
  });

  it('rejects gallery-origin proof when completing a visit', async () => {
    const visit = await Visit.create({
      clientVisitId: 'offline-visit-2',
      parentId: parent._id,
      caregiverId: caregiver._id,
      subscriptionId: (await Subscription.findOne())._id,
      scheduledAt: new Date(),
      status: 'scheduled',
      statusHistory: [{ status: 'scheduled', at: new Date(), byUserId: client._id }],
      checklist: { medicationTaken: true, mood: 4, concerns: [], capturedAt: new Date() },
    });
    await ParentProfile.updateOne(
      { _id: parent._id },
      { $set: { 'consent.state': 'given', status: 'active' } },
    );
    const response = await request(app)
      .post(`/api/v1/visits/${visit._id}/complete`)
      .set(auth(caregiver))
      .send({
        clientVisitId: 'offline-visit-2',
        completedAt: new Date().toISOString(),
        media: [
          {
            clientMediaId: 'x',
            ref: 'proof',
            capturedAt: new Date(),
            uploadedAt: new Date(),
            sourceFlag: 'gallery',
          },
        ],
      });
    expect(response.status).toBe(422);
    expect(response.body.error.code).toBe('VALIDATION_FAILED');
  });

  it('flags a completed visit when camera proof reaches the server more than 24 hours late', async () => {
    const visit = await Visit.create({
      clientVisitId: 'delayed-upload-visit',
      parentId: parent._id,
      caregiverId: caregiver._id,
      subscriptionId: (await Subscription.findOne())._id,
      scheduledAt: new Date(),
      status: 'scheduled',
      statusHistory: [{ status: 'scheduled', at: new Date(), byUserId: client._id }],
      checklist: { medicationTaken: true, mood: 4, concerns: [], capturedAt: new Date() },
    });
    await ParentProfile.updateOne(
      { _id: parent._id },
      { $set: { 'consent.state': 'given', status: 'active' } },
    );
    const response = await request(app)
      .post(`/api/v1/visits/${visit._id}/complete`)
      .set(auth(caregiver))
      .send({
        clientVisitId: visit.clientVisitId,
        completedAt: new Date().toISOString(),
        media: [
          {
            clientMediaId: 'late-camera-proof',
            ref: 'proof',
            capturedAt: new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString(),
            uploadedAt: new Date().toISOString(),
            sourceFlag: 'in_app_camera',
          },
        ],
      });
    expect(response.status).toBe(200);
    expect(response.body.data).toMatchObject({
      status: 'flagged',
      statusBeforeFlag: 'completed',
      flag: { reason: 'UPLOAD_DELAYED' },
    });
    expect(response.body.data.statusHistory.at(-1)).toMatchObject({
      status: 'flagged',
      reason: 'UPLOAD_DELAYED',
    });
  });

  it('records the documented parent-declined no-fault path', async () => {
    await ParentProfile.updateOne(
      { _id: parent._id },
      { $set: { 'consent.state': 'given', status: 'active' } },
    );
    const visit = await Visit.create({
      clientVisitId: 'parent-declined-visit',
      parentId: parent._id,
      caregiverId: caregiver._id,
      subscriptionId: (await Subscription.findOne())._id,
      scheduledAt: new Date(),
      status: 'scheduled',
      statusHistory: [{ status: 'scheduled', at: new Date(), byUserId: client._id }],
    });
    const response = await request(app)
      .post(`/api/v1/visits/${visit._id}/parent-declined`)
      .set(auth(caregiver))
      .send({ capturedAt: new Date().toISOString(), reason: 'Parent asked to reschedule' });
    expect(response.status).toBe(200);
    expect(response.body.data.status).toBe('parent_declined');
    expect(response.body.data.statusHistory.at(-1)).toMatchObject({
      reason: 'Parent asked to reschedule',
      status: 'parent_declined',
    });
  });
});
