import { afterAll, beforeAll, beforeEach, describe, expect, it } from '@jest/globals';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { env } from '../src/config/env.js';
import { ParentProfile } from '../src/models/ParentProfile.js';
import { AuditEvent } from '../src/models/AuditEvent.js';
import { User } from '../src/models/User.js';
import { encrypt } from '../src/utils/crypto.js';

const parentData = {
  name: 'Amina Bibi',
  age: 68,
  phone: '+923001234567',
  addressText: '12 Care Lane, Rawalpindi',
  locationShareUrl: 'https://www.google.com/maps?q=33.6844,73.0479',
  careNotes: 'Prefers morning visits.',
  emergencyContacts: [
    { name: 'Ayesha Khan', phone: '+971501234567', relation: 'Daughter', priority: 1 },
  ],
};

describe('Parents API', () => {
  let app;
  let mongo;
  let client;
  let otherClient;
  let admin;

  beforeAll(async () => {
    mongo = await MongoMemoryServer.create();
    await mongoose.connect(mongo.getUri());
    app = createApp();
  });

  beforeEach(async () => {
    await Promise.all([
      User.deleteMany({}),
      ParentProfile.deleteMany({}),
      AuditEvent.deleteMany({}),
    ]);
    const passwordHash = await bcrypt.hash('safePass123', 10);
    [client, otherClient, admin] = await User.create([
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
        role: 'client',
        name: 'Other Client',
        email: 'other@example.com',
        phone: '+14155550100',
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
        status: 'active',
      },
    ]);
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongo.stop();
  });

  function tokenFor(user) {
    return jwt.sign({ role: user.role }, env.jwt.accessSecret, {
      algorithm: 'HS256',
      subject: user._id.toString(),
      expiresIn: '15m',
    });
  }

  function authenticated(user) {
    return { Authorization: `Bearer ${tokenFor(user)}` };
  }

  it('creates a pending-consent parent with encrypted sensitive fields', async () => {
    const response = await request(app)
      .post('/api/v1/parents')
      .set(authenticated(client))
      .send(parentData);

    expect(response.status).toBe(201);
    expect(response.body.data).toMatchObject({
      name: 'Amina Bibi',
      status: 'pending_consent',
      location: { lng: 73.0479, lat: 33.6844 },
      locationShareUrl: parentData.locationShareUrl,
      careNotes: parentData.careNotes,
    });
    expect(response.body.data.linkedFamilyMembers).toEqual([]);
    const stored = await ParentProfile.findById(response.body.data.id).select(
      '+addressText +locationShareUrl +careNotes',
    );
    expect(stored.addressText).not.toBe(parentData.addressText);
    expect(stored.locationShareUrl).not.toBe(parentData.locationShareUrl);
    expect(stored.careNotes).not.toBe(parentData.careNotes);
  });

  it('validates duplicate contact priorities and refuses a non-client role', async () => {
    const duplicate = await request(app)
      .post('/api/v1/parents')
      .set(authenticated(client))
      .send({
        ...parentData,
        emergencyContacts: [
          ...parentData.emergencyContacts,
          { name: 'Faisal Khan', phone: '+447700900000', relation: 'Son', priority: 1 },
        ],
      });
    const forbidden = await request(app)
      .post('/api/v1/parents')
      .set(authenticated(admin))
      .send(parentData);

    expect(duplicate.status).toBe(422);
    expect(duplicate.body.error.fields.emergencyContacts).toEqual([
      'Each emergency-contact priority must be unique.',
    ]);
    expect(forbidden.status).toBe(403);
  });

  it('rejects a non-Google location link with field-specific guidance', async () => {
    const response = await request(app)
      .post('/api/v1/parents')
      .set(authenticated(client))
      .send({ ...parentData, locationShareUrl: 'https://example.com/home' });

    expect(response.status).toBe(422);
    expect(response.body.error.fields.locationShareUrl).toEqual([
      'Use a Google Maps share link from maps.google.com or maps.app.goo.gl.',
    ]);
  });

  it('lists only the client’s parents, without sensitive profile fields', async () => {
    await request(app).post('/api/v1/parents').set(authenticated(client)).send(parentData);
    await ParentProfile.create({
      clientId: otherClient._id,
      name: 'Other Parent',
      age: 70,
      addressText: 'ciphertext',
      location: { type: 'Point', coordinates: [73, 33] },
      emergencyContacts: [
        { name: 'Other Contact', phone: '+14155550100', relation: 'Child', priority: 1 },
      ],
    });
    const response = await request(app).get('/api/v1/parents').set(authenticated(client));

    expect(response.status).toBe(200);
    expect(response.body.data.items).toEqual([
      { id: expect.any(String), name: 'Amina Bibi', status: 'pending_consent' },
    ]);
  });

  it('enforces ownership while allowing an admin to read a profile', async () => {
    const created = await request(app)
      .post('/api/v1/parents')
      .set(authenticated(client))
      .send(parentData);
    const forbidden = await request(app)
      .get(`/api/v1/parents/${created.body.data.id}`)
      .set(authenticated(otherClient));
    const allowed = await request(app)
      .get(`/api/v1/parents/${created.body.data.id}`)
      .set(authenticated(admin));

    expect(forbidden.status).toBe(403);
    expect(allowed.status).toBe(200);
    expect(allowed.body.data.addressText).toBe(parentData.addressText);
  });

  it('updates editable profile fields but refuses an unknown profile', async () => {
    const created = await request(app)
      .post('/api/v1/parents')
      .set(authenticated(client))
      .send(parentData);
    const updated = await request(app)
      .patch(`/api/v1/parents/${created.body.data.id}`)
      .set(authenticated(client))
      .send({
        careNotes: 'Prefers afternoon calls.',
        emergencyContacts: [
          { name: 'Ayesha Khan', phone: '+971501234567', relation: 'Daughter', priority: 1 },
          { name: 'Faisal Khan', phone: '+447700900000', relation: 'Son', priority: 2 },
        ],
      });
    const missing = await request(app)
      .patch('/api/v1/parents/invalid')
      .set(authenticated(client))
      .send({ name: 'Amina Bibi' });

    expect(updated.status).toBe(200);
    expect(updated.body.data.careNotes).toBe('Prefers afternoon calls.');
    expect(updated.body.data.emergencyContacts).toHaveLength(2);
    expect(missing.status).toBe(404);
  });

  it('allows the owner to withdraw consent and pauses the parent profile', async () => {
    const created = await request(app)
      .post('/api/v1/parents')
      .set(authenticated(client))
      .send(parentData);
    const response = await request(app)
      .post(`/api/v1/parents/${created.body.data.id}/consent/withdraw`)
      .set(authenticated(client));

    expect(response.status).toBe(200);
    expect(response.body.data).toMatchObject({
      status: 'paused',
      consent: { state: 'withdrawn' },
    });
    const stored = await ParentProfile.findById(created.body.data.id);
    expect(stored.consent.history).toEqual([
      expect.objectContaining({ state: 'withdrawn', at: expect.any(Date) }),
    ]);
  });

  it('mints an audited, short-lived consent playback link for the owner and admin only', async () => {
    const parent = await ParentProfile.create({
      clientId: client._id,
      name: 'Amina Bibi',
      age: 68,
      addressText: encrypt(parentData.addressText),
      location: { type: 'Point', coordinates: [73.0479, 33.6844] },
      emergencyContacts: parentData.emergencyContacts,
      consent: { state: 'given', recordingRef: encrypt('rozvisit/consent/amina_recording') },
      status: 'active',
    });

    const allowed = await request(app)
      .post(`/api/v1/parents/${parent._id}/consent/playback`)
      .set(authenticated(client));
    const adminAllowed = await request(app)
      .post(`/api/v1/parents/${parent._id}/consent/playback`)
      .set(authenticated(admin));
    const denied = await request(app)
      .post(`/api/v1/parents/${parent._id}/consent/playback`)
      .set(authenticated(otherClient));

    expect(allowed.status).toBe(200);
    expect(allowed.body.data).toEqual({
      url: expect.stringContaining('/download?'),
      expiresAt: expect.any(String),
    });
    expect(adminAllowed.status).toBe(200);
    expect(denied.status).toBe(403);
    expect(await AuditEvent.countDocuments({ action: 'consent.recording_played' })).toBe(2);
  });
});
