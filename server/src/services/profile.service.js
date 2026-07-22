import { CONSENT_STATE, PARENT_STATUS, ROLES } from '../config/constants.js';
import { parentRepository } from '../repositories/parent.repo.js';
import { subscriptionRepository } from '../repositories/subscription.repo.js';
import { visitRepository } from '../repositories/visit.repo.js';
import { notifyRecipient } from '../notifications/dispatch.js';
import { auditRepository } from '../repositories/audit.repo.js';
import { cloudinaryMediaStorage } from '../interfaces/media.cloudinary.js';
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from '../utils/AppError.js';
import { decrypt, encrypt } from '../utils/crypto.js';
import { resolveGoogleMapsShareUrl } from '../utils/googleMaps.js';

function decryptOptional(value) {
  return value ? decrypt(value) : null;
}

function serializeParent(profile, subscription = null) {
  return {
    id: profile._id.toString(),
    clientId: profile.clientId.toString(),
    linkedFamilyMembers: profile.linkedFamilyMembers.map((member) => member.toString()),
    name: profile.name,
    age: profile.age,
    phone: profile.phone,
    addressText: decrypt(profile.addressText),
    locationShareUrl: decryptOptional(profile.locationShareUrl),
    location: { lng: profile.location.coordinates[0], lat: profile.location.coordinates[1] },
    careNotes: decryptOptional(profile.careNotes),
    emergencyContacts: profile.emergencyContacts,
    consent: { state: profile.consent.state },
    status: profile.status,
    subscriptionSummary: subscription
      ? {
          id: subscription._id.toString(),
          state: subscription.state,
          planKey: subscription.planKey,
          visitsPerWeek: ['active', 'grace'].includes(subscription.state)
            ? subscription.planSnapshot.visitsPerWeek
            : null,
        }
      : null,
  };
}

function startOfWeek(date) {
  const value = new Date(date);
  value.setHours(0, 0, 0, 0);
  value.setDate(value.getDate() - value.getDay());
  return value;
}

async function schedulingSummary(subscription, now = new Date()) {
  if (!subscription || !['active', 'grace'].includes(subscription.state)) return null;
  const currentWeekStart = startOfWeek(now);
  const currentWeekEnd = new Date(currentWeekStart);
  currentWeekEnd.setDate(currentWeekEnd.getDate() + 7);
  const reminderWindowStartsAt = new Date(currentWeekEnd);
  reminderWindowStartsAt.setDate(reminderWindowStartsAt.getDate() - 2);
  const nextWeekEnd = new Date(currentWeekEnd);
  nextWeekEnd.setDate(nextWeekEnd.getDate() + 7);
  const [currentVisits, nextVisits] = await Promise.all([
    visitRepository.findWeekBySubscription(subscription._id, currentWeekStart, currentWeekEnd),
    visitRepository.findWeekBySubscription(subscription._id, currentWeekEnd, nextWeekEnd),
  ]);
  const countable = (visit) => visit.status !== 'parent_declined';
  const currentWeekSet = currentVisits.some(countable);
  const reminderWindowOpen = now >= reminderWindowStartsAt;
  const nextWeekSet = nextVisits.some(countable);
  return {
    currentWeekEndsAt: currentWeekEnd,
    reminderWindowOpen,
    scheduleEnabled: currentWeekSet ? reminderWindowOpen && !nextWeekSet : !nextWeekSet,
    targetWeekStart: currentWeekSet ? currentWeekEnd : currentWeekStart,
  };
}

function encryptFields(data) {
  const update = { ...data };
  if (data.addressText !== undefined) update.addressText = encrypt(data.addressText);
  if (data.careNotes !== undefined && data.careNotes !== null)
    update.careNotes = encrypt(data.careNotes);
  if (data.locationShareUrl !== undefined) update.locationShareUrl = encrypt(data.locationShareUrl);
  return update;
}

async function resolveLocation(data) {
  if (data.locationShareUrl === undefined) return data;
  try {
    const { coordinates } = await resolveGoogleMapsShareUrl(data.locationShareUrl);
    return {
      ...data,
      location: { type: 'Point', coordinates: [coordinates.lng, coordinates.lat] },
    };
  } catch (error) {
    throw new ValidationError('Please fix the highlighted location.', {
      locationShareUrl: [error.message],
    });
  }
}

export const profileService = Object.freeze({
  async createParent(clientId, data) {
    const located = await resolveLocation(data);
    const profile = await parentRepository.create({
      clientId,
      linkedFamilyMembers: [],
      ...encryptFields(located),
      status: PARENT_STATUS.PENDING_CONSENT,
    });
    return serializeParent(profile);
  },

  async listParents(clientId) {
    const profiles = await parentRepository.findByClientId(clientId);
    return profiles.map((profile) => ({
      id: profile._id.toString(),
      name: profile.name,
      status: profile.status,
    }));
  },

  async getParent(actor, parentId) {
    const profile = await parentRepository.findById(parentId);
    if (!profile) throw new NotFoundError();
    if (actor.role !== ROLES.ADMIN && profile.clientId.toString() !== actor.sub)
      throw new ForbiddenError();
    const subscription = await subscriptionRepository.findLatestByParent(parentId);
    const summary = serializeParent(profile, subscription);
    return { ...summary, schedulingSummary: await schedulingSummary(subscription) };
  },

  async updateParent(clientId, parentId, data) {
    const existing = await parentRepository.findById(parentId);
    if (!existing) throw new NotFoundError();
    if (existing.clientId.toString() !== clientId) throw new ForbiddenError();

    const profile = await parentRepository.updateOwned(
      parentId,
      clientId,
      encryptFields(await resolveLocation(data)),
    );
    return serializeParent(profile);
  },

  async withdrawConsent(actor, parentId) {
    const existing = await parentRepository.findById(parentId);
    if (!existing) throw new NotFoundError();
    if (actor.role !== ROLES.ADMIN && existing.clientId.toString() !== actor.sub) {
      throw new ForbiddenError();
    }

    const wasWithdrawn = existing.consent.state === CONSENT_STATE.WITHDRAWN;
    const profile = await parentRepository.withdrawConsent(parentId, {
      $set: {
        'consent.state': CONSENT_STATE.WITHDRAWN,
        status: PARENT_STATUS.PAUSED,
      },
      $push: {
        'consent.history': { state: CONSENT_STATE.WITHDRAWN, at: new Date() },
      },
    });
    if (!wasWithdrawn) {
      await notifyRecipient({
        recipientId: profile.clientId,
        targetId: profile._id,
        type: 'consent_withdrawn',
        values: { parentName: profile.name },
      });
    }
    return serializeParent(profile);
  },

  async createConsentPlayback(actor, parentId) {
    const profile = await parentRepository.findById(parentId);
    if (!profile) throw new NotFoundError();
    if (actor.role !== ROLES.ADMIN && profile.clientId.toString() !== actor.sub) {
      throw new ForbiddenError();
    }
    if (profile.consent.state !== CONSENT_STATE.GIVEN || !profile.consent.recordingRef) {
      throw new ConflictError(
        'STATE_INVALID',
        'A consent recording is not available for this parent.',
      );
    }
    const playback = cloudinaryMediaStorage.createConsentPlaybackUrl({
      recordingRef: decrypt(profile.consent.recordingRef),
    });
    await auditRepository.create({
      actorId: actor.sub,
      action: 'consent.recording_played',
      targetType: 'parentProfile',
      targetId: profile._id,
      detail: {},
      at: new Date(),
    });
    return playback;
  },
});
