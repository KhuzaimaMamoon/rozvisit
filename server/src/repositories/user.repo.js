import { ClientProfile } from '../models/ClientProfile.js';
import { User } from '../models/User.js';

export const userRepository = Object.freeze({
  createUser(data) {
    return User.create(data);
  },
  findByEmailWithPassword(email) {
    return User.findOne({ email }).select('+passwordHash');
  },
  findByEmail(email) {
    return User.findOne({ email });
  },
  findById(id) {
    return User.findById(id);
  },
  findByIdWithPermissions(id) {
    return User.findById(id).select('role status permissions');
  },
  markEmailVerified(id, at) {
    return User.findByIdAndUpdate(id, { emailVerifiedAt: at }, { new: true });
  },
  updatePassword(id, passwordHash) {
    return User.findByIdAndUpdate(id, { passwordHash }, { new: true }).select('+passwordHash');
  },
  createClientProfile(data) {
    return ClientProfile.create(data);
  },
  findClientProfile(userId) {
    return ClientProfile.findOne({ userId });
  },
});
