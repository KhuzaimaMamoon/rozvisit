import mongoose from 'mongoose';

const { Schema } = mongoose;

export const AUTH_TOKEN_TYPES = Object.freeze({
  EMAIL_VERIFICATION: 'email_verification',
  PASSWORD_RESET: 'password_reset',
});

const authTokenSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    tokenHash: { type: String, required: true, select: false },
    type: { type: String, enum: Object.values(AUTH_TOKEN_TYPES), required: true },
    expiresAt: { type: Date, required: true },
    usedAt: { type: Date, default: null },
  },
  { strict: 'throw', timestamps: { createdAt: true, updatedAt: false } },
);

authTokenSchema.index({ tokenHash: 1 });
authTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const AuthToken = mongoose.models.AuthToken ?? mongoose.model('AuthToken', authTokenSchema);
