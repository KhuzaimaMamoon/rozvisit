import { CaregiverProfile } from '../models/CaregiverProfile.js';
import { CAREGIVER_STATUS } from '../config/constants.js';
import mongoose from 'mongoose';

const sensitiveVerificationFields =
  '+verification.cnicNumber +verification.cnicDocRef +verification.interviewRecordingRef +verification.gateRecords.cnic.note +verification.gateRecords.interview.note +verification.gateRecords.reference.note';

export const caregiverRepository = Object.freeze({
  create(data) {
    return CaregiverProfile.create(data);
  },
  findVerifiedByUserId(userId) {
    return CaregiverProfile.findOne({ userId, status: CAREGIVER_STATUS.VERIFIED });
  },
  findByUserId(userId) {
    return CaregiverProfile.findOne({ userId });
  },
  findApplicationById(id) {
    if (!mongoose.isValidObjectId(id)) return null;
    return CaregiverProfile.findById(id)
      .populate('userId', 'name email phone')
      .select(sensitiveVerificationFields);
  },
  listApplications({ limit, skip, status }) {
    const filter = status ? { status } : {};
    return CaregiverProfile.find(filter)
      .populate('userId', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
  },
  countApplications(status) {
    return CaregiverProfile.countDocuments(status ? { status } : {});
  },
  updateApplication(id, update) {
    if (!mongoose.isValidObjectId(id)) return null;
    return CaregiverProfile.findByIdAndUpdate(id, update, {
      new: true,
      runValidators: true,
    })
      .populate('userId', 'name email phone')
      .select(sensitiveVerificationFields);
  },
});
