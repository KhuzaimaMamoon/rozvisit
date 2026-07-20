import { afterAll, beforeAll, beforeEach, describe, expect, it } from '@jest/globals';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { env } from '../src/config/env.js';
import { ADMIN_PERMISSIONS } from '../src/config/constants.js';
import { CarePlan } from '../src/models/CarePlan.js';
import { ClientProfile } from '../src/models/ClientProfile.js';
import { ParentProfile } from '../src/models/ParentProfile.js';
import { Subscription } from '../src/models/Subscription.js';
import { User } from '../src/models/User.js';
import { PLAN_REFERENCE_DATA } from '../src/config/planReferenceData.js';

describe('Plans and subscriptions API', () => {
  let admin;
  let app;
  let client;
  let mongo;
  let parent;

  beforeAll(async () => {
    mongo = await MongoMemoryServer.create();
    await mongoose.connect(mongo.getUri());
    app = createApp();
  });

  beforeEach(async () => {
    await Promise.all([
      CarePlan.deleteMany({}),
      ClientProfile.deleteMany({}),
      ParentProfile.deleteMany({}),
      Subscription.deleteMany({}),
      User.deleteMany({}),
    ]);
    await CarePlan.insertMany(PLAN_REFERENCE_DATA);
    const passwordHash = await bcrypt.hash('safePass123', 10);
    [client, admin] = await User.create([
      {
        role: 'client',
        name: 'Ayesha Khan',
        email: 'ayesha@example.com',
        phone: '+971501234567',
        passwordHash,
        emailVerifiedAt: new Date(),
        status: 'active',
      },
      {
        role: 'admin',
        name: 'Nasreen Shah',
        email: 'nasreen@example.com',
        phone: '+923001234568',
        passwordHash,
        emailVerifiedAt: new Date(),
        permissions: [ADMIN_PERMISSIONS.SUBSCRIPTIONS_MANAGE],
        status: 'active',
      },
    ]);
    await ClientProfile.create({ userId: client._id, countryCode: 'AE', currency: 'AED' });
    parent = await ParentProfile.create({
      clientId: client._id,
      name: 'Amina Bibi',
      age: 68,
      addressText: 'ciphertext',
      location: { type: 'Point', coordinates: [73.0479, 33.6844] },
      emergencyContacts: [
        { name: 'Ayesha Khan', phone: '+971501234567', relation: 'Daughter', priority: 1 },
      ],
    });
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongo.stop();
  });

  function authenticated(user) {
    const token = jwt.sign({ role: user.role }, env.jwt.accessSecret, {
      algorithm: 'HS256',
      subject: user._id.toString(),
      expiresIn: '15m',
    });
    return { Authorization: `Bearer ${token}` };
  }

  it('lists currency-specific display ranges, then preserves the agreed activation price', async () => {
    const plans = await request(app).get('/api/v1/plans').set(authenticated(client));
    expect(plans.status).toBe(200);
    expect(plans.body.data.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: 'Basic',
          currency: 'AED',
          price: { min: 90, max: 130 },
        }),
      ]),
    );

    const selected = await request(app)
      .post('/api/v1/subscriptions')
      .set(authenticated(client))
      .send({ parentId: parent._id.toString(), planKey: 'Standard' });
    expect(selected.status).toBe(201);
    expect(selected.body.data.planSnapshot).toMatchObject({
      visitsPerWeek: 3,
      errandsPerWeek: 1,
      price: null,
      currency: null,
    });

    const linkSent = await request(app)
      .patch(`/api/v1/admin/subscriptions/${selected.body.data.id}/state`)
      .set(authenticated(admin))
      .send({ state: 'link_sent' });
    expect(linkSent.status).toBe(200);

    const active = await request(app)
      .patch(`/api/v1/admin/subscriptions/${selected.body.data.id}/state`)
      .set(authenticated(admin))
      .send({ state: 'active', paymentRef: 'PAY-123', price: 195, currency: 'AED' });
    expect(active.status).toBe(200);
    expect(active.body.data.planSnapshot).toMatchObject({ price: 195, currency: 'AED' });
    expect(active.body.data.currentPeriodEnd).toEqual(expect.any(String));

    await CarePlan.updateOne({ key: 'Standard' }, { 'prices.AED.min': 1, 'prices.AED.max': 2 });
    const detail = await request(app)
      .get(`/api/v1/subscriptions/${selected.body.data.id}`)
      .set(authenticated(client));
    expect(detail.body.data.planSnapshot).toMatchObject({ price: 195, currency: 'AED' });
  });

  it('rejects an incomplete activation and records owner cancellation history', async () => {
    const selected = await request(app)
      .post('/api/v1/subscriptions')
      .set(authenticated(client))
      .send({ parentId: parent._id.toString(), planKey: 'Basic' });
    await request(app)
      .patch(`/api/v1/admin/subscriptions/${selected.body.data.id}/state`)
      .set(authenticated(admin))
      .send({ state: 'link_sent' });
    const incomplete = await request(app)
      .patch(`/api/v1/admin/subscriptions/${selected.body.data.id}/state`)
      .set(authenticated(admin))
      .send({ state: 'active', paymentRef: 'PAY-123' });
    expect(incomplete.status).toBe(422);

    await request(app)
      .patch(`/api/v1/admin/subscriptions/${selected.body.data.id}/state`)
      .set(authenticated(admin))
      .send({ state: 'active', paymentRef: 'PAY-123', price: 100, currency: 'AED' });
    const cancelled = await request(app)
      .post(`/api/v1/subscriptions/${selected.body.data.id}/cancel`)
      .set(authenticated(client));
    expect(cancelled.status).toBe(200);
    expect(cancelled.body.data.state).toBe('cancelled');
    expect(cancelled.body.data.stateHistory.at(-1)).toMatchObject({ state: 'cancelled' });
  });
});
