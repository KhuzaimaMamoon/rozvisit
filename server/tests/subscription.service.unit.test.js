import { afterAll, beforeAll, beforeEach, describe, expect, it } from '@jest/globals';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { PLAN_NAMES, SUBSCRIPTION_STATE } from '../src/config/constants.js';
import { Subscription } from '../src/models/Subscription.js';
import { subscriptionService } from '../src/services/subscription.service.js';

describe('subscriptionService grace transitions', () => {
  let mongo;

  beforeAll(async () => {
    mongo = await MongoMemoryServer.create();
    await mongoose.connect(mongo.getUri());
  });

  beforeEach(async () => {
    await Subscription.deleteMany({});
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongo.stop();
  });

  it('moves expired active subscriptions through grace and then paused with history', async () => {
    const now = new Date('2026-07-19T00:00:00.000Z');
    const subscription = await Subscription.create({
      clientId: new mongoose.Types.ObjectId(),
      parentId: new mongoose.Types.ObjectId(),
      planKey: PLAN_NAMES.BASIC,
      planSnapshot: { visitsPerWeek: 1, errandsPerWeek: 0, price: 30, currency: 'USD' },
      state: SUBSCRIPTION_STATE.ACTIVE,
      stateHistory: [
        { state: SUBSCRIPTION_STATE.ACTIVE, at: new Date('2026-06-18T00:00:00.000Z') },
      ],
      currentPeriodEnd: new Date('2026-07-18T00:00:00.000Z'),
    });

    await subscriptionService.applyGracePeriodTransitions(now);
    let refreshed = await Subscription.findById(subscription._id);
    expect(refreshed.state).toBe(SUBSCRIPTION_STATE.GRACE);
    expect(refreshed.stateHistory.at(-1).state).toBe(SUBSCRIPTION_STATE.GRACE);

    await subscriptionService.applyGracePeriodTransitions(new Date('2026-07-24T00:00:00.000Z'));
    refreshed = await Subscription.findById(subscription._id);
    expect(refreshed.state).toBe(SUBSCRIPTION_STATE.PAUSED);
    expect(refreshed.stateHistory.at(-1).state).toBe(SUBSCRIPTION_STATE.PAUSED);
  });
});
