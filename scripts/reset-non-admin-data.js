import mongoose from 'mongoose';
import { env } from '../server/src/config/env.js';
import { AuditEvent } from '../server/src/models/AuditEvent.js';
import { AuthToken } from '../server/src/models/AuthToken.js';
import { CaregiverProfile } from '../server/src/models/CaregiverProfile.js';
import { ClientProfile } from '../server/src/models/ClientProfile.js';
import { Notification } from '../server/src/models/Notification.js';
import { NotificationFailure } from '../server/src/models/NotificationFailure.js';
import { ParentProfile } from '../server/src/models/ParentProfile.js';
import { RefreshToken } from '../server/src/models/RefreshToken.js';
import { Subscription } from '../server/src/models/Subscription.js';
import { User } from '../server/src/models/User.js';
import { Visit } from '../server/src/models/Visit.js';

if (env.nodeEnv === 'production') {
  throw new Error('Refusing to remove data in production.');
}

await mongoose.connect(env.mongoUri);
try {
  const nonAdminUsers = await User.find({ role: { $ne: 'admin' } }).select('_id');
  const userIds = nonAdminUsers.map((user) => user._id);
  const parents = await ParentProfile.find({ clientId: { $in: userIds } }).select('_id');
  const parentIds = parents.map((parent) => parent._id);

  await Promise.all([
    Visit.deleteMany({ parentId: { $in: parentIds } }),
    Subscription.deleteMany({ parentId: { $in: parentIds } }),
    ParentProfile.deleteMany({ _id: { $in: parentIds } }),
    CaregiverProfile.deleteMany({ userId: { $in: userIds } }),
    ClientProfile.deleteMany({ userId: { $in: userIds } }),
    Notification.deleteMany({ userId: { $in: userIds } }),
    NotificationFailure.deleteMany({}),
    AuthToken.deleteMany({ userId: { $in: userIds } }),
    RefreshToken.deleteMany({ userId: { $in: userIds } }),
    AuditEvent.deleteMany({ $or: [{ actorId: { $in: userIds } }, { targetId: { $in: userIds } }] }),
    User.deleteMany({ _id: { $in: userIds } }),
  ]);

  process.stdout.write(`Removed ${userIds.length} non-admin users and their related test data.\n`);
} finally {
  await mongoose.disconnect();
}
