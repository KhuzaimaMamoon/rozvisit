import { afterAll, beforeAll, beforeEach, describe, expect, it } from '@jest/globals';
import bcrypt from 'bcrypt';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { Notification } from '../src/models/Notification.js';
import { NotificationFailure } from '../src/models/NotificationFailure.js';
import { User } from '../src/models/User.js';
import { NOTIFICATION_CHANNEL, ROLES } from '../src/config/constants.js';
import { notificationService } from '../src/services/notification.service.js';

const PASSWORD = 'safePass123';

describe('Notification API', () => {
  let app;
  let mongo;

  beforeAll(async () => {
    mongo = await MongoMemoryServer.create();
    await mongoose.connect(mongo.getUri());
    app = createApp();
  });

  beforeEach(async () => {
    await Promise.all([
      Notification.deleteMany({}),
      NotificationFailure.deleteMany({}),
      User.deleteMany({}),
    ]);
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongo.stop();
  });

  async function createUser(overrides = {}) {
    return User.create({
      email: 'ayesha@example.com',
      emailVerifiedAt: new Date(),
      name: 'Ayesha Khan',
      passwordHash: await bcrypt.hash(PASSWORD, 10),
      phone: '+971501234567',
      role: ROLES.CLIENT,
      status: 'active',
      ...overrides,
    });
  }

  async function tokenFor(user) {
    const response = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: user.email, password: PASSWORD });
    return response.body.data.accessToken;
  }

  it('lists a user’s notifications with an unread count and marks an owned notification read', async () => {
    const user = await createUser();
    const notification = await notificationService.notify({
      body: 'A caregiver has been assigned to Amina Bibi.',
      channels: [NOTIFICATION_CHANNEL.IN_APP],
      idempotencyKey: `visit_assigned:${user._id}:visit-1`,
      title: 'A caregiver has been assigned',
      type: 'visit_assigned',
      userId: user._id,
    });
    const token = await tokenFor(user);

    const list = await request(app)
      .get('/api/v1/notifications')
      .set('Authorization', `Bearer ${token}`);
    const read = await request(app)
      .post(`/api/v1/notifications/${notification.id}/read`)
      .set('Authorization', `Bearer ${token}`);

    expect(list.status).toBe(200);
    expect(list.body.data.unreadCount).toBe(1);
    expect(list.body.data.items[0]).toMatchObject({ id: notification.id, readAt: null });
    expect(read.status).toBe(200);
    expect(read.body.data.readAt).toEqual(expect.any(String));
  });

  it('does not duplicate the same idempotency key and rejects another user marking it read', async () => {
    const user = await createUser();
    const other = await createUser({ email: 'other@example.com' });
    const input = {
      body: 'Your Standard plan is active.',
      channels: [NOTIFICATION_CHANNEL.IN_APP],
      idempotencyKey: `subscription_active:${user._id}:subscription-1`,
      title: 'Your plan is active',
      type: 'subscription_active',
      userId: user._id,
    };
    const first = await notificationService.notify(input);
    const second = await notificationService.notify(input);
    const forbidden = await request(app)
      .post(`/api/v1/notifications/${first.id}/read`)
      .set('Authorization', `Bearer ${await tokenFor(other)}`);

    expect(first.id).toBe(second.id);
    expect(await Notification.countDocuments()).toBe(1);
    expect(forbidden.status).toBe(404);
  });

  it('allows admins to inspect permanent notification failures', async () => {
    const admin = await createUser({ email: 'nasreen@example.com', role: ROLES.ADMIN });
    const notification = await Notification.create({
      body: 'A visit needs attention.',
      deliveries: [
        {
          attempts: 4,
          channel: NOTIFICATION_CHANNEL.EMAIL,
          failedPermanently: true,
          state: 'failed',
        },
      ],
      idempotencyKey: `flag_raised:${admin._id}:visit-1`,
      title: 'A visit needs attention',
      type: 'flag_raised',
      userId: admin._id,
    });
    await NotificationFailure.create({ notificationId: notification._id });

    const response = await request(app)
      .get('/api/v1/notifications/failures')
      .set('Authorization', `Bearer ${await tokenFor(admin)}`);

    expect(response.status).toBe(200);
    expect(response.body.data.items[0]).toMatchObject({
      notificationId: notification._id.toString(),
      type: 'notif.failed',
    });
  });
});
