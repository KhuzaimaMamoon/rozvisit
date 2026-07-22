import mongoose from 'mongoose';
import { CONSENT_STATE, PARENT_STATUS } from '../config/constants.js';

const { Schema } = mongoose;

const emergencyContactSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true },
    relation: { type: String, required: true, trim: true },
    priority: { type: Number, required: true, min: 1 },
  },
  { _id: false },
);

const parentProfileSchema = new Schema(
  {
    clientId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    linkedFamilyMembers: {
      type: [Schema.Types.ObjectId],
      ref: 'User',
      required: true,
      default: [],
    },
    name: { type: String, required: true, trim: true },
    age: { type: Number, required: true, min: 40, max: 120 },
    phone: { type: String, default: null },
    addressText: { type: String, required: true, select: false },
    locationShareUrl: { type: String, default: null, select: false },
    location: {
      type: { type: String, enum: ['Point'], required: true, default: 'Point' },
      coordinates: {
        type: [Number],
        required: true,
        validate: { validator: (value) => value.length === 2 },
      },
    },
    careNotes: { type: String, default: null, select: false },
    emergencyContacts: {
      type: [emergencyContactSchema],
      required: true,
      validate: { validator: (value) => value.length >= 1 },
    },
    consent: {
      state: {
        type: String,
        enum: Object.values(CONSENT_STATE),
        required: true,
        default: CONSENT_STATE.PENDING,
      },
      recordingRef: { type: String, default: null, select: false },
      choices: {
        preferredTimes: { type: [String], default: undefined, select: false },
        photoBoundaries: { type: String, default: null, select: false },
        other: { type: String, default: null, select: false },
      },
      history: {
        type: [{ state: String, at: Date, byVisitId: Schema.Types.ObjectId }],
        default: [],
      },
    },
    status: {
      type: String,
      enum: Object.values(PARENT_STATUS),
      required: true,
      default: PARENT_STATUS.PENDING_CONSENT,
    },
  },
  { strict: 'throw', timestamps: true },
);

parentProfileSchema.index({ clientId: 1 });
parentProfileSchema.index({ location: '2dsphere' });

export const ParentProfile =
  mongoose.models.ParentProfile ?? mongoose.model('ParentProfile', parentProfileSchema);
