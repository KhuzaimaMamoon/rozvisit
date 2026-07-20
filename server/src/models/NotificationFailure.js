import mongoose from 'mongoose';

const { Schema } = mongoose;

const notificationFailureSchema = new Schema(
  {
    notificationId: {
      type: Schema.Types.ObjectId,
      ref: 'Notification',
      required: true,
      unique: true,
    },
    state: { type: String, required: true, default: 'open' },
    type: { type: String, required: true, default: 'notif.failed' },
  },
  { strict: 'throw', timestamps: { createdAt: true, updatedAt: true } },
);

notificationFailureSchema.index({ state: 1, createdAt: -1 });

export const NotificationFailure =
  mongoose.models.NotificationFailure ??
  mongoose.model('NotificationFailure', notificationFailureSchema);
