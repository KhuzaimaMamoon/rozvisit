import bcrypt from 'bcrypt';
import mongoose from 'mongoose';
import { env } from '../server/src/config/env.js';
import { ADMIN_PERMISSIONS, ROLES, USER_STATUS } from '../server/src/config/constants.js';
import { User } from '../server/src/models/User.js';

const BCRYPT_COST = 10;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^\+[1-9]\d{1,14}$/;

function requiredValue(name, { trim = true } = {}) {
  const rawValue = process.env[name];
  const value = trim ? rawValue?.trim() : rawValue;

  if (!value) {
    throw new Error(`${name} is required.`);
  }

  return value;
}

function readAdminInput() {
  const name = requiredValue('ADMIN_NAME');
  const email = requiredValue('ADMIN_EMAIL').toLowerCase();
  const phone = requiredValue('ADMIN_PHONE');
  const password = requiredValue('ADMIN_PASSWORD', { trim: false });

  if (name.length < 2 || name.length > 100) {
    throw new Error('ADMIN_NAME must be between 2 and 100 characters.');
  }
  if (!EMAIL_PATTERN.test(email)) {
    throw new Error('ADMIN_EMAIL must be a valid email address.');
  }
  if (!PHONE_PATTERN.test(phone)) {
    throw new Error('ADMIN_PHONE must include a country code, for example +923001234567.');
  }
  if (
    password.length < 8 ||
    password.length > 128 ||
    !/[A-Za-z]/.test(password) ||
    !/\d/.test(password)
  ) {
    throw new Error(
      'ADMIN_PASSWORD must be 8 to 128 characters and include at least one letter and one number.',
    );
  }

  return { email, name, password, phone };
}

async function createAdmin() {
  const { email, name, password, phone } = readAdminInput();

  await mongoose.connect(env.mongoUri);
  try {
    if (await User.exists({ email })) {
      throw new Error(`Refusing to create an account because ${email} already exists.`);
    }

    const passwordHash = await bcrypt.hash(password, BCRYPT_COST);
    const permissions = Object.values(ADMIN_PERMISSIONS);

    try {
      await User.create({
        email,
        emailVerifiedAt: new Date(),
        name,
        passwordHash,
        permissions,
        phone,
        role: ROLES.ADMIN,
        status: USER_STATUS.ACTIVE,
      });
    } catch (error) {
      if (error?.code === 11000) {
        throw new Error(`Refusing to create an account because ${email} already exists.`);
      }
      throw error;
    }

    process.stdout.write(
      `Created verified admin account for ${email} with ${permissions.length} permissions.\n`,
    );
  } finally {
    await mongoose.disconnect();
  }
}

try {
  await createAdmin();
} catch (error) {
  process.stderr.write(`Admin creation failed: ${error.message}\n`);
  process.exitCode = 1;
}
