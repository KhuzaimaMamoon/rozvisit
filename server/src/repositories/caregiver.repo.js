import { CaregiverProfile } from '../models/CaregiverProfile.js';
import { CAREGIVER_STATUS } from '../config/constants.js';
import mongoose from 'mongoose';

const sensitiveVerificationFields =
  '+verification.cnicNumber +verification.cnicDocRef +verification.interviewRecordingRef +verification.gateRecords.cnic.note +verification.gateRecords.interview.note +verification.gateRecords.reference.note';

async function countWithExistingUser(filter) {
  const [result] = await CaregiverProfile.aggregate([
    { $match: filter },
    {
      $lookup: {
        from: 'users',
        localField: 'userId',
        foreignField: '_id',
        as: 'userRecord',
      },
    },
    { $match: { 'userRecord.0': { $exists: true } } },
    { $count: 'total' },
  ]);
  return result?.total ?? 0;
}

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
    return countWithExistingUser(status ? { status } : {});
  },
  listDirectory({ limit, skip, view = 'active' }) {
    return CaregiverProfile.find(
      view === 'active'
        ? { status: { $ne: CAREGIVER_STATUS.DEACTIVATED } }
        : view === 'archived'
          ? { status: CAREGIVER_STATUS.DEACTIVATED }
          : {},
    )
      .populate('userId', 'name email phone')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
  },
  countDirectory(view = 'active') {
    return countWithExistingUser(
      view === 'active'
        ? { status: { $ne: CAREGIVER_STATUS.DEACTIVATED } }
        : view === 'archived'
          ? { status: CAREGIVER_STATUS.DEACTIVATED }
          : {},
    );
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
