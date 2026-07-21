import mongoose from 'mongoose';
import { env } from '../server/src/config/env.js';
import { ADMIN_PERMISSIONS, ROLES } from '../server/src/config/constants.js';
import { User } from '../server/src/models/User.js';

if (env.nodeEnv === 'production') {
  throw new Error('Refusing to change admin permissions in production.');
}

const directoryPermissions = [
  ADMIN_PERMISSIONS.CAREGIVERS_DIRECTORY_VIEW,
  ADMIN_PERMISSIONS.CAREGIVERS_CNIC_VIEW,
  ADMIN_PERMISSIONS.CLIENTS_DIRECTORY_VIEW,
];

await mongoose.connect(env.mongoUri);
try {
  const result = await User.updateMany(
    { role: ROLES.ADMIN },
    { $addToSet: { permissions: { $each: directoryPermissions } } },
  );
  process.stdout.write(
    `Updated directory permissions for ${result.modifiedCount} admin account(s).\n`,
  );
} finally {
  await mongoose.disconnect();
}
