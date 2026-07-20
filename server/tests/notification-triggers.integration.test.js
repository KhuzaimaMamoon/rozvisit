import { afterAll, beforeAll, beforeEach, describe, expect, it } from '@jest/globals';
import bcrypt from 'bcrypt';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import {
  CAREGIVER_STATUS,
  CONSENT_STATE,
  PARENT_STATUS,
  ROLES,
  SUBSCRIPTION_STATE,
  USER_STATUS,
  VISIT_STATUS,
} from '../src/config/constants.js';
import { adminService } from '../src/services/admin.service.js';
import { authService } from '../src/services/auth.service.js';
import { profileService } from '../src/services/profile.service.js';
import { subscriptionService } from '../src/services/subscription.service.js';
import { visitService } from '../src/services/visit.service.js';
import { AuditEvent } from '../src/models/AuditEvent.js';
import { AuthToken } from '../src/models/AuthToken.js';
import { CaregiverProfile } from '../src/models/CaregiverProfile.js';
import { ClientProfile } from '../src/models/ClientProfile.js';
import { Notification } from '../src/models/Notification.js';
import { ParentProfile } from '../src/models/ParentProfile.js';
import { RefreshToken } from '../src/models/RefreshToken.js';
import { Subscription } from '../src/models/Subscription.js';
import { User } from '../src/models/User.js';
import { Visit } from '../src/models/Visit.js';
import { encrypt } from '../src/utils/crypto.js';

describe('notification trigger map', () => {
  let mongo;

  beforeAll(async () => {
    mongo = await MongoMemoryServer.create();
    await mongoose.connect(mongo.getUri());
  });

  beforeEach(async () => {
    await Promise.all([
      AuditEvent.deleteMany({}),
      AuthToken.deleteMany({}),
      CaregiverProfile.deleteMany({}),
      ClientProfile.deleteMany({}),
      Notification.deleteMany({}),
      ParentProfile.deleteMany({}),
      RefreshToken.deleteMany({}),
      Subscription.deleteMany({}),
      User.deleteMany({}),
      Visit.deleteMany({}),
    ]);
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongo.stop();
  });

  async function notification(type, userId) {
    return Notification.findOne({ type, userId }).sort({ createdAt: -1 });
  }

  function scheduledVisit({ caregiverId, parentId, subscriptionId, suffix }) {
    return Visit.create({
      caregiverId,
      clientVisitId: `trigger-${suffix}`,
      parentId,
      scheduledAt: new Date('2026-07-20T10:00:00.000Z'),
      status: VISIT_STATUS.SCHEDULED,
      statusHistory: [{ status: VISIT_STATUS.SCHEDULED, at: new Date() }],
      subscriptionId,
    });
  }

  it('persists every implemented notification trigger with canonical recipients and substitutions', async () => {
    const passwordHash = await bcrypt.hash('safePass123', 10);
    const admin = await User.create({
      email: 'nasreen@example.com',
      emailVerifiedAt: new Date(),
      name: 'Nasreen Shah',
      passwordHash,
      phone: '+923001234568',
      role: ROLES.ADMIN,
      status: USER_STATUS.ACTIVE,
    });
    const registration = await authService.register({
      countryCode: 'AE',
      email: 'ayesha@example.com',
      name: 'Ayesha Khan',
      password: 'safePass123',
      phone: '+971501234567',
    });
    const client = await User.findById(registration.userId);
    expect((await notification('registration_verify', client._id)).body).toBe(
      'Tap the link to confirm your email and get started with RozVisit.',
    );

    const applicationResult = await authService.apply({
      cnicNumber: '3520212345671',
      email: 'bilal@example.com',
      name: 'Bilal Ahmed',
      password: 'caregiverPass123',
      phone: '+923001234567',
      serviceArea: { lat: 33.6844, lng: 73.0479, radiusKm: 12 },
    });
    const caregiver = await User.findById(applicationResult.userId);
    const application = await CaregiverProfile.findOne({ userId: caregiver._id });
    expect((await notification('application_received', caregiver._id)).body).toBe(
      'Thank you for applying. We will review your details and be in touch soon.',
    );
    expect((await notification('admin_new_application', admin._id)).body).toBe(
      'A new caregiver application is ready for review.',
    );

    await adminService.recordCnicGate(admin._id, application._id, {
      cnicDocRef: 'rozvisit/applications/bilal/cnic',
      verified: true,
    });
    await adminService.recordInterviewGate(admin._id, application._id, { passed: true });
    await adminService.recordReferenceGate(admin._id, application._id, {
      referenceOutcome: 'positive',
    });
    await adminService.decideApplication(admin._id, application._id, { decision: 'approve' });
    expect((await notification('application_decision', caregiver._id)).body).toBe(
      'Good news -- your application is approved. Welcome to RozVisit.',
    );
    expect((await CaregiverProfile.findById(application._id)).status).toBe(
      CAREGIVER_STATUS.VERIFIED,
    );

    const parent = await ParentProfile.create({
      age: 68,
      clientId: client._id,
      consent: { state: CONSENT_STATE.GIVEN },
      emergencyContacts: [
        { name: 'Ayesha Khan', phone: '+971501234567', priority: 1, relation: 'Daughter' },
      ],
      location: { coordinates: [73.0479, 33.6844], type: 'Point' },
      name: 'Amina Bibi',
      phone: '+92511234567',
      status: PARENT_STATUS.ACTIVE,
      addressText: encrypt('Rawalpindi'),
    });
    const selected = await Subscription.create({
      clientId: client._id,
      currentPeriodEnd: new Date('2026-08-20T00:00:00.000Z'),
      parentId: parent._id,
      planKey: 'Standard',
      planSnapshot: { currency: null, errandsPerWeek: 1, price: null, visitsPerWeek: 3 },
      state: SUBSCRIPTION_STATE.SELECTED,
      stateHistory: [{ at: new Date(), state: SUBSCRIPTION_STATE.SELECTED }],
    });
    await subscriptionService.updateAdminState(admin._id, selected._id, { state: 'link_sent' });
    const activated = await subscriptionService.updateAdminState(admin._id, selected._id, {
      currency: 'AED',
      paymentRef: 'PAY-195',
      price: 195,
      state: 'active',
    });
    expect((await notification('subscription_active', client._id)).body).toBe(
      'Your Standard plan is now active. You can schedule visits for Amina Bibi.',
    );
    expect((await notification('admin_payment_reconciled', admin._id)).body).toBe(
      "A payment has been recorded for Ayesha Khan's subscription.",
    );
    await subscriptionService.cancelSubscription(client._id, activated.id);
    expect((await notification('subscription_cancelled', client._id)).body).toBe(
      'Your Standard plan has been cancelled. You can view your visit history anytime.',
    );

    const renewal = await Subscription.create({
      clientId: client._id,
      currentPeriodEnd: new Date('2026-07-18T00:00:00.000Z'),
      parentId: parent._id,
      planKey: 'Basic',
      planSnapshot: { currency: 'AED', errandsPerWeek: 0, price: 100, visitsPerWeek: 1 },
      state: SUBSCRIPTION_STATE.ACTIVE,
      stateHistory: [
        { at: new Date('2026-06-18T00:00:00.000Z'), state: SUBSCRIPTION_STATE.ACTIVE },
      ],
    });
    await subscriptionService.applyGracePeriodTransitions(new Date('2026-07-19T00:00:00.000Z'));
    expect((await notification('subscription_grace', client._id)).body).toBe(
      'Your Basic plan is in a grace period. Please renew to avoid a pause in visits.',
    );
    await subscriptionService.applyGracePeriodTransitions(new Date('2026-07-24T00:00:00.000Z'));
    expect((await notification('subscription_paused', client._id)).body).toBe(
      'Your Basic plan is now paused. Renew anytime to resume visits.',
    );

    const assigned = await scheduledVisit({
      parentId: parent._id,
      subscriptionId: renewal._id,
      suffix: 'assigned',
    });
    await adminService.assignVisit(admin._id, assigned._id, caregiver._id);
    expect((await notification('visit_assigned', client._id)).body).toBe(
      'Bilal Ahmed will visit Amina Bibi on 2026-07-20.',
    );

    const completed = await scheduledVisit({
      caregiverId: caregiver._id,
      parentId: parent._id,
      subscriptionId: renewal._id,
      suffix: 'complete',
    });
    await visitService.saveChecklist(caregiver._id.toString(), completed._id.toString(), {
      capturedAt: new Date('2026-07-20T10:15:00.000Z'),
      concerns: [],
      medicationTaken: true,
      mood: 4,
    });
    await visitService.complete(caregiver._id.toString(), completed._id.toString(), {
      clientVisitId: completed.clientVisitId,
      completedAt: new Date('2026-07-20T10:30:00.000Z'),
      media: [
        {
          capturedAt: new Date('2026-07-20T10:20:00.000Z'),
          clientMediaId: 'completed-photo',
          ref: 'https://example.test/completed.jpg',
          sourceFlag: 'in_app_camera',
          uploadedAt: new Date('2026-07-20T10:21:00.000Z'),
        },
      ],
    });
    expect((await notification('visit_completed', client._id)).body).toBe(
      "Bilal Ahmed completed today's visit with Amina Bibi. See the details in your feed.",
    );

    const declined = await scheduledVisit({
      caregiverId: caregiver._id,
      parentId: parent._id,
      subscriptionId: renewal._id,
      suffix: 'declined',
    });
    await visitService.parentDeclined(caregiver._id.toString(), declined._id.toString(), {
      capturedAt: new Date('2026-07-20T10:35:00.000Z'),
    });
    expect((await notification('visit_parent_declined', client._id)).body).toBe(
      "Amina Bibi chose not to have today's visit. No action is needed from you.",
    );

    const flagged = await scheduledVisit({
      caregiverId: caregiver._id,
      parentId: parent._id,
      subscriptionId: renewal._id,
      suffix: 'flagged',
    });
    await visitService.saveChecklist(caregiver._id.toString(), flagged._id.toString(), {
      capturedAt: new Date('2026-07-20T11:00:00.000Z'),
      concerns: [],
      medicationTaken: true,
      mood: 4,
    });
    await visitService.complete(caregiver._id.toString(), flagged._id.toString(), {
      clientVisitId: flagged.clientVisitId,
      completedAt: new Date('2026-07-20T11:30:00.000Z'),
      media: [
        {
          capturedAt: new Date('2026-07-18T11:00:00.000Z'),
          clientMediaId: 'flagged-photo',
          ref: 'https://example.test/flagged.jpg',
          sourceFlag: 'in_app_camera',
          uploadedAt: new Date('2026-07-20T11:20:00.000Z'),
        },
      ],
    });
    expect((await notification('flag_raised', admin._id)).body).toBe(
      'A visit for Amina Bibi has been flagged: UPLOAD_DELAYED.',
    );

    await profileService.withdrawConsent(
      { role: ROLES.CLIENT, sub: client._id.toString() },
      parent._id,
    );
    expect((await notification('consent_withdrawn', client._id)).body).toBe(
      'Amina Bibi has withdrawn consent for visits. Scheduling is paused until this is resolved.',
    );
  });
});
