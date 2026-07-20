import mongoose from 'mongoose';
import { CAREGIVER_STATUS } from '../config/constants.js';

const { Schema } = mongoose;

const gateRecordSchema = new Schema(
  {
    recordedAt: { type: Date, default: null },
    recordedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    note: { type: String, default: null, select: false },
  },
  { _id: false },
);

const caregiverProfileSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    verification: {
      cnicNumber: { type: String, required: true, select: false },
      cnicDocRef: { type: String, default: null, select: false },
      interviewRecordingRef: { type: String, default: null, select: false },
      referenceOutcome: {
        type: String,
        enum: ['positive', 'negative', 'unreachable'],
        default: null,
      },
      gates: {
        cnic: { type: Boolean, required: true, default: false },
        interview: { type: Boolean, required: true, default: false },
        reference: { type: Boolean, required: true, default: false },
      },
      gateRecords: {
        cnic: { type: gateRecordSchema, default: () => ({}) },
        interview: { type: gateRecordSchema, default: () => ({}) },
        reference: { type: gateRecordSchema, default: () => ({}) },
      },
      decidedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
      decidedAt: { type: Date, default: null },
    },
    serviceArea: {
      type: { type: String, enum: ['Point'], required: true, default: 'Point' },
      coordinates: {
        type: [Number],
        required: true,
        validate: { validator: (value) => value.length === 2 },
      },
      radiusKm: { type: Number, required: true },
    },
    rating: {
      average: { type: Number, required: true, default: 0 },
      count: { type: Number, required: true, default: 0 },
    },
    status: {
      type: String,
      enum: Object.values(CAREGIVER_STATUS),
      required: true,
      default: CAREGIVER_STATUS.APPLIED,
    },
  },
  { strict: 'throw', timestamps: true },
);

caregiverProfileSchema.index({ serviceArea: '2dsphere' });
caregiverProfileSchema.index({ status: 1 });

export const CaregiverProfile =
  mongoose.models.CaregiverProfile ?? mongoose.model('CaregiverProfile', caregiverProfileSchema);
