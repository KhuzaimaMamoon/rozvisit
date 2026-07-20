import { afterAll, beforeAll, beforeEach, describe, expect, it } from '@jest/globals';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { env } from '../src/config/env.js';
import { CaregiverProfile } from '../src/models/CaregiverProfile.js';
import { ParentProfile } from '../src/models/ParentProfile.js';
import { Subscription } from '../src/models/Subscription.js';
import { User } from '../src/models/User.js';
import { Visit } from '../src/models/Visit.js';

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
});
