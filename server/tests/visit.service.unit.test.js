import { afterAll, beforeAll, beforeEach, describe, expect, it } from '@jest/globals';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { CaregiverProfile } from '../src/models/CaregiverProfile.js';
import { ParentProfile } from '../src/models/ParentProfile.js';
import { Subscription } from '../src/models/Subscription.js';
import { User } from '../src/models/User.js';
import { Visit } from '../src/models/Visit.js';
import { visitService } from '../src/services/visit.service.js';

describe('visitService', () => {
  let mongo;
  let client;
  let caregiver;
  let unverified;
  let parent;
  let subscription;
  beforeAll(async () => {
    mongo = await MongoMemoryServer.create();
    await mongoose.connect(mongo.getUri());
  });
  beforeEach(async () => {
    await Promise.all([
      User.deleteMany({}),
      ParentProfile.deleteMany({}),
      Subscription.deleteMany({}),
      CaregiverProfile.deleteMany({}),
      Visit.deleteMany({}),
    ]);
    [client, caregiver, unverified] = await User.create([
      {
        role: 'client',
        name: 'Ayesha Khan',
        email: 'ayesha@test.com',
        phone: '+971501234567',
        passwordHash: 'hash',
        status: 'active',
      },
      {
        role: 'caregiver',
        name: 'Bilal Ahmed',
        email: 'bilal@test.com',
        phone: '+923001234567',
        passwordHash: 'hash',
        status: 'active',
      },
      {
        role: 'caregiver',
        name: 'Unverified Carer',
        email: 'other@test.com',
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
    subscription = await Subscription.create({
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

  it('schedules unassigned visits, refuses an allowance excess, then assigns only a verified caregiver', async () => {
    await expect(
      visitService.schedule(client._id.toString(), {
        parentId: parent._id.toString(),
        slots: [
          { dayOfWeek: 1, time: '10:00' },
          { dayOfWeek: 3, time: '10:00' },
          { dayOfWeek: 5, time: '10:00' },
          { dayOfWeek: 6, time: '10:00' },
        ],
      }),
    ).rejects.toMatchObject({ code: 'ALLOWANCE_EXCEEDED' });
    const scheduled = await visitService.schedule(client._id.toString(), {
      parentId: parent._id.toString(),
      slots: [{ dayOfWeek: 1, time: '10:00' }],
      standingNote: 'Check medicine',
    });
    expect(scheduled.items[0].caregiverId).toBeNull();
    await expect(
      visitService.assign(client._id.toString(), scheduled.items[0].id, unverified._id.toString()),
    ).rejects.toMatchObject({ code: 'VALIDATION_FAILED' });
    const assigned = await visitService.assign(
      client._id.toString(),
      scheduled.items[0].id,
      caregiver._id.toString(),
    );
    expect(assigned.caregiverId).toBe(caregiver._id.toString());
  });

  it.each([
    ['Basic', 1],
    ['Standard', 3],
    ['Premium', 7],
  ])(
    'enforces the %s weekly allowance across separate schedule submissions',
    async (_plan, limit) => {
      subscription.planKey = _plan;
      subscription.planSnapshot.visitsPerWeek = limit;
      await subscription.save();

      const initialSlots = Array.from({ length: limit }, (_, index) => ({
        dayOfWeek: index,
        time: '10:00',
      }));
      await visitService.schedule(client._id.toString(), {
        parentId: parent._id.toString(),
        slots: initialSlots,
      });

      await expect(
        visitService.schedule(client._id.toString(), {
          parentId: parent._id.toString(),
          slots: [{ dayOfWeek: 0, time: '11:00' }],
        }),
      ).rejects.toMatchObject({ code: 'ALLOWANCE_EXCEEDED' });
    },
  );

  it('requires assignment for caregiver actions and pauses the parent on declined consent', async () => {
    const [visit] = await Visit.create([
      {
        clientVisitId: 'visit-one',
        parentId: parent._id,
        subscriptionId: subscription._id,
        scheduledAt: new Date(),
        status: 'scheduled',
        statusHistory: [{ status: 'scheduled', at: new Date() }],
      },
    ]);
    await expect(
      visitService.saveChecklist(caregiver._id.toString(), visit._id.toString(), {
        medicationTaken: true,
        mood: 4,
        concerns: [],
        capturedAt: new Date(),
      }),
    ).rejects.toMatchObject({ code: 'STATE_INVALID' });
    await visitService.assign(
      client._id.toString(),
      visit._id.toString(),
      caregiver._id.toString(),
    );
    const result = await visitService.captureConsent(
      caregiver._id.toString(),
      parent._id.toString(),
      { state: 'declined', byVisitId: visit._id.toString() },
    );
    expect(result.parentStatus).toBe('paused');
    const stored = await ParentProfile.findById(parent._id);
    expect(stored.status).toBe('paused');
    expect(stored.consent.state).toBe('declined');
  });

  it('creates per-camera permits and preserves an offline completion exactly once', async () => {
    await ParentProfile.updateOne(
      { _id: parent._id },
      { $set: { 'consent.state': 'given', status: 'active' } },
    );
    const visit = await Visit.create({
      clientVisitId: 'visit-offline-once',
      parentId: parent._id,
      caregiverId: caregiver._id,
      subscriptionId: subscription._id,
      scheduledAt: new Date(),
      status: 'scheduled',
      statusHistory: [{ status: 'scheduled', at: new Date() }],
      checklist: { medicationTaken: true, mood: 5, concerns: [], capturedAt: new Date() },
    });
    const capturedAt = new Date('2026-07-20T12:00:00Z');
    const permit = await visitService.createMediaPermit(
      caregiver._id.toString(),
      visit._id.toString(),
      {
        items: [{ clientMediaId: 'camera-1', capturedAt, mediaType: 'photo' }],
      },
    );
    expect(permit.permits[0].publicId).toContain('camera-1');
    const payload = {
      clientVisitId: visit.clientVisitId,
      completedAt: new Date(),
      media: [
        {
          clientMediaId: 'camera-1',
          ref: 'proof',
          capturedAt,
          uploadedAt: new Date(),
          sourceFlag: 'in_app_camera',
        },
      ],
    };
    const first = await visitService.complete(
      caregiver._id.toString(),
      visit._id.toString(),
      payload,
    );
    const replay = await visitService.complete(
      caregiver._id.toString(),
      visit._id.toString(),
      payload,
    );
    expect(first.status).toBe('completed');
    expect(replay.statusHistory.filter((event) => event.status === 'completed')).toHaveLength(1);
  });
});
