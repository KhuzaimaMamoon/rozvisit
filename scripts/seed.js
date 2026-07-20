import bcrypt from 'bcrypt';
import mongoose from 'mongoose';
import { env } from '../server/src/config/env.js';
import {
  ADMIN_PERMISSIONS,
  CAREGIVER_STATUS,
  CONSENT_STATE,
  PARENT_STATUS,
  ROLES,
  SUBSCRIPTION_STATE,
  USER_STATUS,
  VISIT_STATUS,
} from '../server/src/config/constants.js';
import { PLAN_REFERENCE_DATA } from '../server/src/config/planReferenceData.js';
import { CaregiverProfile } from '../server/src/models/CaregiverProfile.js';
import { ClientProfile } from '../server/src/models/ClientProfile.js';
import { ParentProfile } from '../server/src/models/ParentProfile.js';
import { Subscription } from '../server/src/models/Subscription.js';
import { User } from '../server/src/models/User.js';
import { Visit } from '../server/src/models/Visit.js';
import { planRepository } from '../server/src/repositories/plan.repo.js';
import { encrypt } from '../server/src/utils/crypto.js';

const SEEDED_USERS = Object.freeze({
  admin: {
    email: 'nasreen-admin@example.com',
    name: 'Nasreen Shah',
    password: 'adminPass123',
    phone: '+923001234568',
    role: ROLES.ADMIN,
    permissions: Object.values(ADMIN_PERMISSIONS),
  },
  caregiver: {
    email: 'bilal-caregiver@example.com',
    name: 'Bilal Ahmed',
    password: 'caregiverPass123',
    phone: '+923001234567',
    role: ROLES.CAREGIVER,
  },
  client: {
    email: 'ayesha-client@example.com',
    name: 'Ayesha Khan',
    password: 'safePass123',
    phone: '+971501234567',
    role: ROLES.CLIENT,
  },
});

const RAWALPINDI_COORDINATES = [73.0479, 33.5651];
const SEEDED_PARENT_NAME = 'Amina Bibi';

function atDayOffset(days, hours = 10) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  date.setHours(hours, 0, 0, 0);
  return date;
}

async function upsertVerifiedUser(person) {
  const passwordHash = await bcrypt.hash(person.password, 10);
  return User.findOneAndUpdate(
    { email: person.email },
    {
      $set: {
        emailVerifiedAt: new Date(),
        name: person.name,
        passwordHash,
        phone: person.phone,
        role: person.role,
        status: USER_STATUS.ACTIVE,
        permissions: person.permissions ?? [],
      },
      $setOnInsert: { email: person.email },
    },
    { new: true, upsert: true, setDefaultsOnInsert: true },
  );
}

async function seedVisits({ caregiver, client, parent, subscription }) {
  const scheduledAt = new Date();
  const completedAt = atDayOffset(-1, 11);
  const missedAt = atDayOffset(-2, 11);
  const completedCaptureAt = atDayOffset(-1, 11);
  const visits = [
    {
      clientVisitId: 'seed-visit-scheduled',
      caregiverId: caregiver._id,
      parentId: parent._id,
      scheduledAt,
      status: VISIT_STATUS.SCHEDULED,
      statusHistory: [{ status: VISIT_STATUS.SCHEDULED, at: scheduledAt, byUserId: client._id }],
    },
    {
      clientVisitId: 'seed-visit-completed',
      caregiverId: caregiver._id,
      parentId: parent._id,
      scheduledAt: completedAt,
      status: VISIT_STATUS.COMPLETED,
      statusHistory: [
        { status: VISIT_STATUS.SCHEDULED, at: atDayOffset(-1, 10), byUserId: client._id },
        { status: VISIT_STATUS.COMPLETED, at: completedAt, byUserId: caregiver._id },
      ],
      checklist: {
        medicationTaken: true,
        mood: 4,
        concerns: [],
        note: encrypt('A calm seeded visit for local proof-feed testing.'),
        completedAt,
        capturedAt: completedCaptureAt,
      },
      media: [
        {
          clientMediaId: 'seed-media-completed',
          ref: 'https://res.cloudinary.com/rozvisit/image/upload/v1/seed/amina-completed-proof.jpg',
          capturedAt: completedCaptureAt,
          uploadedAt: completedAt,
          sourceFlag: 'in_app_camera',
        },
      ],
    },
    {
      clientVisitId: 'seed-visit-missed',
      caregiverId: caregiver._id,
      parentId: parent._id,
      scheduledAt: missedAt,
      status: VISIT_STATUS.MISSED,
      statusHistory: [
        { status: VISIT_STATUS.SCHEDULED, at: atDayOffset(-2, 10), byUserId: client._id },
        {
          status: VISIT_STATUS.MISSED,
          at: missedAt,
          byUserId: caregiver._id,
          reason: 'parent_unavailable',
        },
      ],
    },
  ];

  await Promise.all(
    visits.map((visit) =>
      Visit.findOneAndUpdate(
        { clientVisitId: visit.clientVisitId },
        { $set: { ...visit, standingNote: null, subscriptionId: subscription._id } },
        { new: true, upsert: true, setDefaultsOnInsert: true },
      ),
    ),
  );
}

async function seed() {
  if (env.nodeEnv === 'production') {
    throw new Error('Refusing to create development seed accounts in production.');
  }
  await mongoose.connect(env.mongoUri);
  try {
    await planRepository.upsertReferencePlans(PLAN_REFERENCE_DATA);
    const [admin, caregiver, client] = await Promise.all([
      upsertVerifiedUser(SEEDED_USERS.admin),
      upsertVerifiedUser(SEEDED_USERS.caregiver),
      upsertVerifiedUser(SEEDED_USERS.client),
    ]);
    await ClientProfile.findOneAndUpdate(
      { userId: client._id },
      { $set: { countryCode: 'AE', currency: 'AED' } },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    );
    await CaregiverProfile.findOneAndUpdate(
      { userId: caregiver._id },
      {
        $set: {
          verification: {
            cnicNumber: encrypt('35202-1234567-1'),
            gates: { cnic: true, interview: true, reference: true },
          },
          serviceArea: { type: 'Point', coordinates: RAWALPINDI_COORDINATES, radiusKm: 12 },
          status: CAREGIVER_STATUS.VERIFIED,
        },
      },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    );
    const parent = await ParentProfile.findOneAndUpdate(
      { clientId: client._id, name: SEEDED_PARENT_NAME },
      {
        $set: {
          addressText: encrypt('Rawalpindi family home'),
          age: 68,
          consent: {
            state: CONSENT_STATE.GIVEN,
            recordingRef: encrypt('rozvisit/seed/consent-amina-bibi'),
            choices: {
              preferredTimes: ['Morning'],
              photoBoundaries: encrypt('Living room only.'),
              other: null,
            },
            history: [{ state: CONSENT_STATE.GIVEN, at: atDayOffset(-14), byVisitId: null }],
          },
          emergencyContacts: [
            {
              name: 'Ayesha Khan',
              phone: SEEDED_USERS.client.phone,
              priority: 1,
              relation: 'Daughter',
            },
          ],
          linkedFamilyMembers: [],
          location: { type: 'Point', coordinates: RAWALPINDI_COORDINATES },
          phone: '+92515551234',
          status: PARENT_STATUS.ACTIVE,
        },
      },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    );
    const subscription = await Subscription.findOneAndUpdate(
      { parentId: parent._id, state: SUBSCRIPTION_STATE.ACTIVE },
      {
        $set: {
          clientId: client._id,
          currentPeriodEnd: atDayOffset(28),
          planKey: 'Standard',
          planSnapshot: { visitsPerWeek: 3, errandsPerWeek: 1, price: 195, currency: 'AED' },
          state: SUBSCRIPTION_STATE.ACTIVE,
          stateHistory: [
            { state: SUBSCRIPTION_STATE.SELECTED, at: atDayOffset(-14), byUserId: client._id },
            { state: SUBSCRIPTION_STATE.LINK_SENT, at: atDayOffset(-13), byUserId: admin._id },
            {
              state: SUBSCRIPTION_STATE.ACTIVE,
              at: atDayOffset(-12),
              byUserId: admin._id,
              paymentRef: 'seed-payment-aed-195',
            },
          ],
        },
      },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    );
    await seedVisits({ caregiver, client, parent, subscription });
    process.stdout.write(
      [
        'Seeded care plans and development personas (idempotent).',
        'Admin: nasreen-admin@example.com / adminPass123',
        'Client: ayesha-client@example.com / safePass123',
        'Caregiver: bilal-caregiver@example.com / caregiverPass123',
      ].join('\n') + '\n',
    );
  } finally {
    await mongoose.disconnect();
  }
}

seed().catch((error) => {
  process.stderr.write(`Seed failed: ${error.message}\n`);
  process.exit(1);
});
