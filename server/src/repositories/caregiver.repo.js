import { CaregiverProfile } from '../models/CaregiverProfile.js';

export const caregiverRepository = Object.freeze({
  create(data) {
    return CaregiverProfile.create(data);
  },
  findVerifiedByUserId(userId) {
    return CaregiverProfile.findOne({ userId, status: 'verified' });
  },
  findByUserId(userId) {
    return CaregiverProfile.findOne({ userId });
  },
});
