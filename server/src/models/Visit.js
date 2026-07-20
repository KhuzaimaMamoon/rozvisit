import mongoose from 'mongoose';
import { VISIT_STATUS } from '../config/constants.js';

const { Schema } = mongoose;

const statusHistorySchema = new Schema(
  {
    status: { type: String, enum: Object.values(VISIT_STATUS), required: true },
    at: { type: Date, required: true },
    byUserId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    reason: { type: String, default: null },
  },
  { _id: false },
);

const checklistSchema = new Schema(
  {
    medicationTaken: { type: Boolean, required: true },
    mood: { type: Number, required: true, min: 1, max: 5 },
    concerns: { type: [String], required: true, default: [] },
    note: { type: String, default: null, select: false },
    completedAt: { type: Date, default: null },
    capturedAt: { type: Date, required: true },
  },
  { _id: false },
);

const mediaSchema = new Schema(
  {
    clientMediaId: { type: String, required: true },
    ref: { type: String, required: true },
    capturedAt: { type: Date, required: true },
    uploadedAt: { type: Date, required: true },
    sourceFlag: { type: String, required: true },
  },
  { _id: false },
);

const flagSchema = new Schema(
  {
    reason: { type: String, required: true, trim: true },
    raisedAt: { type: Date, required: true },
    resolvedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    resolvedAt: { type: Date, default: null },
    note: { type: String, default: null, select: false },
  },
  { _id: false },
);

const visitSchema = new Schema(
  {
    clientVisitId: { type: String, required: true, trim: true, unique: true },
    parentId: { type: Schema.Types.ObjectId, ref: 'ParentProfile', required: true },
    caregiverId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    subscriptionId: { type: Schema.Types.ObjectId, ref: 'Subscription', required: true },
    scheduledAt: { type: Date, required: true },
    standingNote: { type: String, default: null },
    makeUpPlan: { type: String, default: null },
    status: { type: String, enum: Object.values(VISIT_STATUS), required: true },
    statusHistory: { type: [statusHistorySchema], required: true, default: [] },
    statusBeforeFlag: { type: String, enum: Object.values(VISIT_STATUS), default: null },
    checklist: { type: checklistSchema, default: null },
    media: { type: [mediaSchema], default: [] },
    flag: { type: flagSchema, default: null },
  },
  { strict: 'throw', timestamps: true },
);

visitSchema.index({ caregiverId: 1, scheduledAt: 1 });
visitSchema.index({ parentId: 1, scheduledAt: -1 });
visitSchema.index({ status: 1, scheduledAt: 1 });

export const Visit = mongoose.models.Visit ?? mongoose.model('Visit', visitSchema);
