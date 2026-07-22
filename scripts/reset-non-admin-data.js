import mongoose from 'mongoose';
import { env } from '../server/src/config/env.js';
import { ADMIN_PERMISSIONS } from '../server/src/config/constants.js';

const CONFIRMATION = 'DELETE_ALL_NON_ADMIN_DATA';

if (process.env.CONFIRM_RESET_NON_ADMIN_DATA !== CONFIRMATION) {
  throw new Error(
    `Refusing to reset data. Set CONFIRM_RESET_NON_ADMIN_DATA=${CONFIRMATION} deliberately.`,
  );
}

await mongoose.connect(env.mongoUri);
try {
  const collections = await mongoose.connection.db
    .listCollections({}, { nameOnly: true })
    .toArray();
  const results = [];

  for (const { name } of collections) {
    if (name.startsWith('system.')) continue;

    const collection = mongoose.connection.db.collection(name);
    const result =
      name === 'users'
        ? await collection.deleteMany({ role: { $ne: 'admin' } })
        : name === 'careplans'
          ? { deletedCount: 0 }
          : await collection.deleteMany({});
    results.push({ deleted: result.deletedCount, name });
  }

  const adminCount = await mongoose.connection.db.collection('users').countDocuments({
    role: 'admin',
  });
  await mongoose.connection.db
    .collection('users')
    .updateMany({ role: 'admin' }, { $set: { permissions: Object.values(ADMIN_PERMISSIONS) } });
  const carePlanCount = await mongoose.connection.db.collection('careplans').countDocuments();
  const removedCount = results.reduce((total, result) => total + result.deleted, 0);

  process.stdout.write(
    `Reset complete: removed ${removedCount} records across ${results.length} application collections; preserved ${adminCount} admin user(s) and ${carePlanCount} care plan(s).\n`,
  );
} finally {
  await mongoose.disconnect();
}
