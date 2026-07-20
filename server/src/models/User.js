import mongoose from 'mongoose';
import { ADMIN_PERMISSIONS, ROLES, USER_STATUS } from '../config/constants.js';

const { Schema } = mongoose;

const userSchema = new Schema(
  {
    role: { type: String, enum: Object.values(ROLES), required: true },
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 100 },
    email: { type: String, required: true, trim: true, lowercase: true, unique: true },
    phone: { type: String, required: true },
    passwordHash: { type: String, required: true, select: false },
    emailVerifiedAt: { type: Date, default: null },
    status: { type: String, enum: Object.values(USER_STATUS), required: true },
    permissions: {
      type: [{ type: String, enum: Object.values(ADMIN_PERMISSIONS) }],
      required: true,
      default: [],
    },
  },
  { strict: 'throw', timestamps: true },
);

userSchema.index({ role: 1, status: 1 });

export const User = mongoose.models.User ?? mongoose.model('User', userSchema);
