import { createHash, randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import bcrypt from 'bcrypt';
import mongoose from 'mongoose';
import { configureE2eEnvironment } from './environment.js';

const state = JSON.parse(await readFile('/tmp/rozvisit-e2e-state.json', 'utf8'));
configureE2eEnvironment({ mongoUri: state.mongoUri });

const [
  { encrypt },
  { AuthToken, AUTH_TOKEN_TYPES },
  { AuditEvent },
  { CarePlan },
  { CaregiverProfile },
  { ClientProfile },
  { ParentProfile },
  { Subscription },
  { User },
  { Visit },
] = await Promise.all([
  import('../../server/src/utils/crypto.js'),
  import('../../server/src/models/AuthToken.js'),
  import('../../server/src/models/AuditEvent.js'),
  import('../../server/src/models/CarePlan.js'),
  import('../../server/src/models/CaregiverProfile.js'),
  import('../../server/src/models/ClientProfile.js'),
  import('../../server/src/models/ParentProfile.js'),
  import('../../server/src/models/Subscription.js'),
  import('../../server/src/models/User.js'),
  import('../../server/src/models/Visit.js'),
]);

const password = 'Password123';
let connected = false;

function uniqueEmail(prefix) {
  return `${prefix}-${randomUUID()}@e2e.test`;
}

export {
  AuditEvent,
  AuthToken,
  CaregiverProfile,
  ParentProfile,
  Subscription,
  User,
  Visit,
  password,
};

export async function connectDatabase() {
  if (connected) return;
  await mongoose.connect(state.mongoUri);
  connected = true;
}

export async function disconnectDatabase() {
  if (!connected) return;
  await mongoose.disconnect();
  connected = false;
}

export async function clearDatabase() {
  const collections = await mongoose.connection.db.collections();
  await Promise.all(collections.map((collection) => collection.deleteMany({})));
}

export async function seedPlans() {
  const prices = {
    AED: { max: 130, min: 90 },
    GBP: { max: 28, min: 20 },
    SAR: { max: 135, min: 95 },
    USD: { max: 35, min: 25 },
  };
  await CarePlan.create([
    { active: true, errandsPerWeek: 0, key: 'Basic', prices, visitsPerWeek: 1 },
    { active: true, errandsPerWeek: 1, key: 'Standard', prices, visitsPerWeek: 3 },
    { active: true, errandsPerWeek: null, key: 'Premium', prices, visitsPerWeek: 7 },
  ]);
}

async function createUser({ email, name, role }) {
  return User.create({
    email,
    emailVerifiedAt: new Date(),
    name,
    passwordHash: await bcrypt.hash(password, 10),
    phone: role === 'client' ? '+971501234567' : '+923001234567',
    role,
    status: 'active',
  });
}

export async function createAdmin() {
  return createUser({ email: uniqueEmail('admin'), name: 'Nasreen Shah', role: 'admin' });
}

export async function createClient({ email = uniqueEmail('client'), name = 'Ayesha Khan' } = {}) {
  const user = await createUser({ email, name, role: 'client' });
  await ClientProfile.create({ countryCode: 'AE', currency: 'AED', userId: user._id });
  return user;
}

export async function createCaregiver({
  email = uniqueEmail('caregiver'),
  status = 'verified',
} = {}) {
  const user = await createUser({ email, name: 'Bilal Ahmed', role: 'caregiver' });
  await CaregiverProfile.create({
    serviceArea: { coordinates: [73.0479, 33.6844], radiusKm: 10, type: 'Point' },
    status,
    userId: user._id,
    verification: {
      cnicNumber: encrypt('3520212345678'),
      gates:
        status === 'verified'
          ? { cnic: true, interview: true, reference: true }
          : { cnic: false, interview: false, reference: false },
    },
  });
  return user;
}

export async function createActiveCare({ caregiver, client = null, consentState = 'given' } = {}) {
  const owner = client ?? (await createClient());
  const parent = await ParentProfile.create({
    addressText: encrypt('Satellite Town, Rawalpindi'),
    age: 68,
    clientId: owner._id,
    consent: {
      history: [{ at: new Date(), state: consentState }],
      state: consentState,
    },
    emergencyContacts: [
      { name: 'Ayesha Khan', phone: '+971501234567', priority: 1, relation: 'Daughter' },
    ],
    location: { coordinates: [73.0479, 33.6844], type: 'Point' },
    name: 'Amina Bibi',
    phone: '+92515551234',
    status: consentState === 'given' ? 'active' : 'pending_consent',
  });
  const subscription = await Subscription.create({
    clientId: owner._id,
    currentPeriodEnd: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000),
    parentId: parent._id,
    planKey: 'Standard',
    planSnapshot: { currency: 'AED', errandsPerWeek: 1, price: 195, visitsPerWeek: 3 },
    state: 'active',
    stateHistory: [{ at: new Date(), state: 'active' }],
  });
  const scheduledAt = new Date();
  scheduledAt.setHours(10, 0, 0, 0);
  const visit = await Visit.create({
    caregiverId: caregiver?._id ?? null,
    clientVisitId: randomUUID(),
    parentId: parent._id,
    scheduledAt,
    standingNote: 'Check morning medication.',
    status: 'scheduled',
    statusHistory: [{ at: scheduledAt, status: 'scheduled' }],
    subscriptionId: subscription._id,
  });
  return { client: owner, parent, subscription, visit };
}

export async function createVerificationToken(userId) {
  const token = `e2e-${randomUUID()}`;
  await AuthToken.create({
    expiresAt: new Date(Date.now() + 60 * 60 * 1000),
    tokenHash: createHash('sha256').update(token).digest('hex'),
    type: AUTH_TOKEN_TYPES.EMAIL_VERIFICATION,
    userId,
  });
  return token;
}
