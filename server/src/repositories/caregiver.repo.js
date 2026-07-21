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
  findByUserIds(userIds) {
    return CaregiverProfile.find({ userId: { $in: userIds } }).populate('userId', 'name');
  },
  findVerifiedForAssignment() {
    return CaregiverProfile.find({ status: CAREGIVER_STATUS.VERIFIED })
      .populate('userId', 'name')
      .sort({ 'userId.name': 1 });
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
  listDirectory({ limit, skip }) {
    return CaregiverProfile.find({})
      .populate('userId', 'name email phone')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
  },
  countDirectory() {
    return CaregiverProfile.countDocuments({});
  },
  findDirectoryCnicById(id) {
    if (!mongoose.isValidObjectId(id)) return null;
    return CaregiverProfile.findById(id).select('+verification.cnicNumber');
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
