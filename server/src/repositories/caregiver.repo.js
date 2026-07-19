import { CaregiverProfile } from '../models/CaregiverProfile.js';

export const caregiverRepository = Object.freeze({
  create(data) {
    return CaregiverProfile.create(data);
  },
});
