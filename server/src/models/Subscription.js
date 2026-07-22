import mongoose from 'mongoose';
import { PLAN_NAMES, SUBSCRIPTION_STATE } from '../config/constants.js';

const { Schema } = mongoose;

const planSnapshotSchema = new Schema(
  {
    visitsPerWeek: { type: Number, required: true, min: 1 },
    errandsPerWeek: { type: Number, default: null, min: 0 },
    price: { type: Number, default: null, min: 0 },
    currency: { type: String, enum: ['USD', 'GBP', 'AED', 'SAR'], default: null },
  },
  { _id: false },
);

const stateHistorySchema = new Schema(
  {
    state: { type: String, enum: Object.values(SUBSCRIPTION_STATE), required: true },
    at: { type: Date, required: true },
    byUserId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    paymentRef: { type: String, default: null },
  },
  { _id: false },
);

const subscriptionSchema = new Schema(
  {
    clientId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    parentId: { type: Schema.Types.ObjectId, ref: 'ParentProfile', required: true },
    planKey: { type: String, enum: Object.values(PLAN_NAMES), required: true },
    planSnapshot: { type: planSnapshotSchema, required: true },
    state: { type: String, enum: Object.values(SUBSCRIPTION_STATE), required: true },
    stateHistory: { type: [stateHistorySchema], required: true, default: [] },
    currentPeriodEnd: { type: Date, default: null },
    administrativeArchive: {
      archivedAt: { type: Date, default: null },
      archivedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
      previousState: { type: String, enum: Object.values(SUBSCRIPTION_STATE), default: null },
      reason: { type: String, default: null },
    },
  },
  { strict: 'throw', timestamps: true },
);

subscriptionSchema.index(
  { parentId: 1, state: 1 },
  { unique: true, partialFilterExpression: { state: SUBSCRIPTION_STATE.ACTIVE } },
);
subscriptionSchema.index({ state: 1, currentPeriodEnd: 1 });

export const Subscription =
  mongoose.models.Subscription ?? mongoose.model('Subscription', subscriptionSchema);
