import mongoose from 'mongoose';
import { NOTIFICATION_CHANNEL, NOTIFICATION_DELIVERY_STATE } from '../config/constants.js';

const { Schema } = mongoose;

const deliverySchema = new Schema(
  {
    attempts: { type: Number, required: true, default: 0, min: 0 },
    channel: { type: String, enum: Object.values(NOTIFICATION_CHANNEL), required: true },
    failedPermanently: { type: Boolean, required: true, default: false },
    lastAttemptAt: { type: Date, default: null },
    nextAttemptAt: { type: Date, default: null },
    state: {
      type: String,
      enum: Object.values(NOTIFICATION_DELIVERY_STATE),
      required: true,
      default: NOTIFICATION_DELIVERY_STATE.QUEUED,
    },
  },
  { _id: false },
);

const notificationSchema = new Schema(
  {
    body: { type: String, required: true, trim: true, maxlength: 1000 },
    deliveries: { type: [deliverySchema], required: true, default: [] },
    idempotencyKey: { type: String, required: true, trim: true, unique: true },
    readAt: { type: Date, default: null },
    title: { type: String, required: true, trim: true, maxlength: 200 },
    type: { type: String, required: true, trim: true, maxlength: 100 },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { strict: 'throw', timestamps: { createdAt: true, updatedAt: false } },
);

notificationSchema.index({ userId: 1, createdAt: -1 });

export const Notification =
  mongoose.models.Notification ?? mongoose.model('Notification', notificationSchema);
