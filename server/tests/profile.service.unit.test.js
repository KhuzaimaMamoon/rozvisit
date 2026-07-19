import { afterAll, beforeAll, beforeEach, describe, expect, it } from '@jest/globals';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { ParentProfile } from '../src/models/ParentProfile.js';
import { profileService } from '../src/services/profile.service.js';

describe('profileService', () => {
  let mongo;

  beforeAll(async () => {
    mongo = await MongoMemoryServer.create();
    await mongoose.connect(mongo.getUri());
  });

  beforeEach(async () => {
    await ParentProfile.deleteMany({});
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongo.stop();
  });

  it('keeps a new parent pending consent and retains an empty future family list', async () => {
    const parent = await profileService.createParent(new mongoose.Types.ObjectId(), {
      name: 'Amina Bibi',
      age: 68,
      phone: null,
      addressText: '12 Care Lane',
      location: { lng: 73.0479, lat: 33.6844 },
      careNotes: null,
      emergencyContacts: [
        { name: 'Ayesha Khan', phone: '+971501234567', relation: 'Daughter', priority: 1 },
      ],
    });

    expect(parent.status).toBe('pending_consent');
    expect(parent.linkedFamilyMembers).toEqual([]);
    expect(parent.addressText).toBe('12 Care Lane');
  });
});
