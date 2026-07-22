import { ClientProfile } from '../models/ClientProfile.js';
import { User } from '../models/User.js';
import { ROLES } from '../config/constants.js';

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
  findEmailById(id) {
    return User.findById(id).select('email');
  },
  findByIdWithPermissions(id) {
    return User.findById(id).select('role status permissions');
  },
  findAdmins() {
    return User.find({ role: ROLES.ADMIN, status: 'active' }).select('name');
  },
  listClients({ limit, skip, view = 'active' }) {
    return User.find({
      role: ROLES.CLIENT,
      ...(view === 'active'
        ? { status: 'active' }
        : view === 'archived'
          ? { status: 'disabled' }
          : {}),
    })
      .select('name email phone status archivedAt archiveReason createdAt')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
  },
  countClients(view = 'active') {
    return User.countDocuments({
      role: ROLES.CLIENT,
      ...(view === 'active'
        ? { status: 'active' }
        : view === 'archived'
          ? { status: 'disabled' }
          : {}),
    });
  },
  findClientProfilesByUserIds(userIds) {
    return ClientProfile.find({ userId: { $in: userIds } });
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
  updateUser(id, update) {
    return User.findByIdAndUpdate(id, update, { new: true, runValidators: true });
  },
});
