import crypto from 'node:crypto';
import {
  CAREGIVER_STATUS,
  CONSENT_STATE,
  PARENT_STATUS,
  SUBSCRIPTION_STATE,
  VISIT_STATUS,
} from '../config/constants.js';
import { caregiverRepository } from '../repositories/caregiver.repo.js';
import { parentRepository } from '../repositories/parent.repo.js';
import { subscriptionRepository } from '../repositories/subscription.repo.js';
import { userRepository } from '../repositories/user.repo.js';
import { visitRepository } from '../repositories/visit.repo.js';
import { cloudinaryMediaStorage } from '../interfaces/media.cloudinary.js';
import { notifyRecipient } from '../notifications/dispatch.js';
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from '../utils/AppError.js';
import { encrypt } from '../utils/crypto.js';
import { decrypt } from '../utils/crypto.js';

const UPLOAD_FLAG_DELAY_MS = 24 * 60 * 60 * 1000;
export const WEEKLY_REMINDER_LEAD_DAYS = 2;

function startOfWeek(date) {
  const value = new Date(date);
  value.setHours(0, 0, 0, 0);
  value.setDate(value.getDate() - value.getDay());
  return value;
}

export function dateForSlot(weekStart, dayOfWeek, time, notBefore = null) {
  const [hours, minutes] = time.split(':').map(Number);
  const date = startOfWeek(weekStart);
  date.setDate(date.getDate() + dayOfWeek);
  date.setHours(hours, minutes, 0, 0);
  if (notBefore && date < notBefore) date.setDate(date.getDate() + 7);
  return date;
}

function endOfWeek(date) {
  const end = startOfWeek(date);
  end.setDate(end.getDate() + 7);
  return end;
}

function isCountedWeeklyVisit(visit) {
  return visit.status !== VISIT_STATUS.PARENT_DECLINED;
}

function slotsFromVisits(visits) {
  return visits.filter(isCountedWeeklyVisit).map((visit) => ({
    dayOfWeek: visit.scheduledAt.getDay(),
    time: `${String(visit.scheduledAt.getHours()).padStart(2, '0')}:${String(visit.scheduledAt.getMinutes()).padStart(2, '0')}`,
    standingNote: visit.standingNote,
  }));
}

function scheduleRecord({ clientId, parentId, slot, subscription, weekStart, now }) {
  const scheduledAt = dateForSlot(weekStart, slot.dayOfWeek, slot.time, now);
  return {
    clientVisitId: crypto
      .createHash('sha256')
      .update(`${parentId}:${subscription._id.toString()}:${scheduledAt.toISOString()}`)
      .digest('hex'),
    parentId,
    caregiverId: null,
    subscriptionId: subscription._id,
    scheduledAt,
    standingNote: slot.standingNote ?? null,
    status: VISIT_STATUS.SCHEDULED,
    statusHistory: [{ status: VISIT_STATUS.SCHEDULED, at: now, byUserId: clientId }],
  };
}

function serializeVisit(visit) {
  return {
    id: visit._id.toString(),
    clientVisitId: visit.clientVisitId,
    parentId: visit.parentId.toString(),
    caregiverId: visit.caregiverId?.toString() ?? null,
    subscriptionId: visit.subscriptionId.toString(),
    scheduledAt: visit.scheduledAt,
    standingNote: visit.standingNote,
    makeUpPlan: visit.makeUpPlan,
    status: visit.status,
    statusBeforeFlag: visit.statusBeforeFlag,
    statusHistory: visit.statusHistory,
    checklist: visit.checklist
      ? {
          medicationTaken: visit.checklist.medicationTaken,
          mood: visit.checklist.mood,
          concerns: visit.checklist.concerns,
          completedAt: visit.checklist.completedAt,
          capturedAt: visit.checklist.capturedAt,
        }
      : null,
    media: visit.media.map((item) => ({
      clientMediaId: item.clientMediaId,
      ref: item.ref,
      capturedAt: item.capturedAt,
      uploadedAt: item.uploadedAt,
      sourceFlag: item.sourceFlag,
    })),
    flag: visit.flag
      ? {
          reason: visit.flag.reason,
          raisedAt: visit.flag.raisedAt,
          resolvedAt: visit.flag.resolvedAt,
        }
      : null,
  };
}

function decryptOptional(value) {
  return value ? decrypt(value) : null;
}

function serializeConsentChoices(parent) {
  const choices = parent.consent?.choices;
  if (!choices) return null;
  return {
    preferredTimes: choices.preferredTimes ?? [],
    photoBoundaries: decryptOptional(choices.photoBoundaries),
    other: decryptOptional(choices.other),
  };
}

function serializeCaregiverVisitBase(visit, parent) {
  return {
    id: visit._id.toString(),
    parentName: parent.name,
    addressText: decrypt(parent.addressText),
    location: { lng: parent.location.coordinates[0], lat: parent.location.coordinates[1] },
    scheduledAt: visit.scheduledAt,
    standingNote: visit.standingNote,
    consentChoices: serializeConsentChoices(parent),
    consentState: parent.consent.state,
    status: visit.status,
  };
}

function serializeCaregiverVisitContext(visit, parent) {
  return {
    ...serializeCaregiverVisitBase(visit, parent),
    clientVisitId: visit.clientVisitId,
    parentId: visit.parentId.toString(),
    checklist: serializeVisit(visit).checklist,
    media: serializeVisit(visit).media,
  };
}

async function getAssignedVisit(caregiverId, visitId) {
  const visit = await visitRepository.findById(visitId);
  if (!visit) throw new NotFoundError();
  if (!visit.caregiverId) {
    throw new ConflictError(
      'STATE_INVALID',
      'This visit has not been assigned to a caregiver yet.',
    );
  }
  if (visit.caregiverId.toString() !== caregiverId) throw new ForbiddenError();
  return visit;
}

export const visitService = Object.freeze({
  async schedule(clientId, { parentId, slots, standingNote }) {
    const [parent, subscription] = await Promise.all([
      parentRepository.findById(parentId),
      subscriptionRepository.findActiveByParent(parentId),
    ]);
    if (!parent) throw new NotFoundError();
    if (parent.clientId.toString() !== clientId) throw new ForbiddenError();
    if (parent.status === PARENT_STATUS.PAUSED) {
      throw new ConflictError(
        'CONSENT_REQUIRED',
        'Consent is required before visits can be scheduled.',
      );
    }
    if (!subscription || subscription.state !== SUBSCRIPTION_STATE.ACTIVE) {
      throw new ConflictError(
        'STATE_INVALID',
        'An active subscription is required to schedule visits.',
      );
    }
    const limit = subscription.planSnapshot.visitsPerWeek;
    if (slots.length > limit) {
      throw new ConflictError(
        'ALLOWANCE_EXCEEDED',
        `Your plan includes ${limit} visits per week. Upgrade to add more.`,
      );
    }
    const now = new Date();
    const currentWeekStart = startOfWeek(now);
    const currentWeekEnd = endOfWeek(now);
    const nextWeekEnd = endOfWeek(currentWeekEnd);
    const reminderStart = new Date(currentWeekEnd);
    reminderStart.setDate(reminderStart.getDate() - WEEKLY_REMINDER_LEAD_DAYS);
    const [currentWeekVisits, nextWeekVisits] = await Promise.all([
      visitRepository.findWeekBySubscription(subscription._id, currentWeekStart, currentWeekEnd),
      visitRepository.findWeekBySubscription(subscription._id, currentWeekEnd, nextWeekEnd),
    ]);
    const currentWeekLocked = currentWeekVisits.some(isCountedWeeklyVisit);
    const nextWeekLocked = nextWeekVisits.some(isCountedWeeklyVisit);
    if (nextWeekLocked && !currentWeekLocked) {
      throw new ConflictError(
        'SCHEDULING_LOCKED',
        'Your next weekly visit pattern is already set. You can make changes when the next reminder window opens.',
      );
    }
    if (currentWeekLocked && now < reminderStart) {
      throw new ConflictError(
        'SCHEDULING_LOCKED',
        'This week is already scheduled. You can set next week’s visits when the reminder window opens.',
      );
    }
    const targetWeekStart = currentWeekLocked
      ? new Date(currentWeekEnd)
      : new Date(currentWeekStart);
    const existingTargetVisits = currentWeekLocked ? nextWeekVisits : currentWeekVisits;
    if (existingTargetVisits.some(isCountedWeeklyVisit)) {
      throw new ConflictError(
        'SCHEDULE_ALREADY_SET',
        'Visits are already set for this week. You can update individual visits using reschedule or cancel.',
      );
    }
    const records = slots.map((slot) =>
      scheduleRecord({
        clientId,
        parentId,
        slot: { ...slot, standingNote: standingNote ?? null },
        subscription,
        weekStart: targetWeekStart,
        now,
      }),
    );
    const visits = await visitRepository.upsertScheduled(records);
    return {
      items: visits.map(serializeVisit),
      weekStart: targetWeekStart,
      message: 'This week’s visits are scheduled. A caregiver will be assigned shortly.',
    };
  },

  async processWeeklyCycles(now = new Date()) {
    const subscriptions = await subscriptionRepository.findWeeklySchedulingCandidates();
    const currentWeekStart = startOfWeek(now);
    const currentWeekEnd = endOfWeek(now);
    const reminderStart = new Date(currentWeekEnd);
    reminderStart.setDate(reminderStart.getDate() - WEEKLY_REMINDER_LEAD_DAYS);
    let carriedForward = 0;
    let remindersSent = 0;

    for (const subscription of subscriptions) {
      const [currentVisits, previousVisits, parent] = await Promise.all([
        visitRepository.findWeekBySubscription(subscription._id, currentWeekStart, currentWeekEnd),
        visitRepository.findWeekBySubscription(
          subscription._id,
          new Date(currentWeekStart.getTime() - 7 * 24 * 60 * 60 * 1000),
          currentWeekStart,
        ),
        parentRepository.findById(subscription.parentId),
      ]);
      if (!parent) continue;
      if (!currentVisits.some(isCountedWeeklyVisit)) {
        const priorSlots = slotsFromVisits(previousVisits);
        const futureSlots = priorSlots.filter(
          (slot) => dateForSlot(currentWeekStart, slot.dayOfWeek, slot.time) > now,
        );
        if (futureSlots.length) {
          await visitRepository.upsertScheduled(
            futureSlots.map((slot) =>
              scheduleRecord({
                clientId: subscription.clientId,
                parentId: subscription.parentId,
                slot,
                subscription,
                weekStart: currentWeekStart,
                now,
              }),
            ),
          );
          carriedForward += 1;
        }
      }
      if (now >= reminderStart && currentVisits.some(isCountedWeeklyVisit)) {
        await notifyRecipient({
          recipientId: subscription.clientId,
          targetId: `${subscription._id}:${currentWeekEnd.toISOString()}`,
          type: 'weekly_reschedule_reminder',
          values: { parentName: parent.name },
        });
        remindersSent += 1;
      }
    }
    return { carriedForward, remindersSent };
  },

  async assign(_adminId, visitId, caregiverId) {
    const [visit, caregiver] = await Promise.all([
      visitRepository.findById(visitId),
      caregiverRepository.findVerifiedByUserId(caregiverId),
    ]);
    if (!visit) throw new NotFoundError();
    if (!caregiver || caregiver.status !== CAREGIVER_STATUS.VERIFIED) {
      throw new ValidationError('The caregiver must be verified before assignment.', {
        caregiverId: ['Choose a verified caregiver.'],
      });
    }
    const updated = await visitRepository.update(visitId, { $set: { caregiverId } });
    return serializeVisit(updated);
  },

  async today(caregiverId, now = new Date()) {
    const caregiver = await caregiverRepository.findVerifiedByUserId(caregiverId);
    if (!caregiver) throw new ForbiddenError();
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);
    const visits = await visitRepository.findTodayByCaregiver(caregiverId, start, end);
    const parents = await Promise.all(
      visits.map((visit) => parentRepository.findById(visit.parentId)),
    );
    return {
      items: visits.map((visit, index) => serializeCaregiverVisitBase(visit, parents[index])),
    };
  },

  async mine(caregiverId, { before, limit }) {
    const caregiver = await caregiverRepository.findVerifiedByUserId(caregiverId);
    if (!caregiver) throw new ForbiddenError();
    const visits = await visitRepository.findMineByCaregiver(caregiverId, {
      before,
      limit: limit + 1,
    });
    const hasNextPage = visits.length > limit;
    const page = hasNextPage ? visits.slice(0, limit) : visits;
    const parents = await Promise.all(
      page.map((visit) => parentRepository.findById(visit.parentId)),
    );
    return {
      items: page.map((visit, index) => serializeCaregiverVisitBase(visit, parents[index])),
      nextCursor: hasNextPage ? page.at(-1).scheduledAt.toISOString() : null,
    };
  },

  async getCaregiverVisit(caregiverId, visitId) {
    const visit = await getAssignedVisit(caregiverId, visitId);
    const parent = await parentRepository.findById(visit.parentId);
    if (!parent) throw new NotFoundError();
    return serializeCaregiverVisitContext(visit, parent);
  },

  async createConsentPermit(caregiverId, parentId, { byVisitId }) {
    const [parent, visit] = await Promise.all([
      parentRepository.findById(parentId),
      getAssignedVisit(caregiverId, byVisitId),
    ]);
    if (!parent) throw new NotFoundError();
    if (parent.consent.state !== CONSENT_STATE.PENDING || visit.parentId.toString() !== parentId) {
      throw new ForbiddenError();
    }
    return cloudinaryMediaStorage.createConsentUploadPermit({ parentId });
  },

  async captureConsent(caregiverId, parentId, { state, recordingRef, choices, byVisitId }) {
    const [parent, visit] = await Promise.all([
      parentRepository.findById(parentId),
      getAssignedVisit(caregiverId, byVisitId),
    ]);
    if (!parent) throw new NotFoundError();
    if (visit.parentId.toString() !== parentId) {
      throw new ForbiddenError();
    }
    if (parent.consent.state === CONSENT_STATE.GIVEN) {
      throw new ConflictError('STATE_INVALID', 'Consent has already been recorded.');
    }
    const now = new Date();
    const update = {
      $set: {
        'consent.state': state,
        status: state === CONSENT_STATE.GIVEN ? PARENT_STATUS.ACTIVE : PARENT_STATUS.PAUSED,
        'consent.recordingRef': recordingRef ? encrypt(recordingRef) : null,
        'consent.choices': choices
          ? {
              preferredTimes: choices.preferredTimes,
              photoBoundaries: choices.photoBoundaries ? encrypt(choices.photoBoundaries) : null,
              other: choices.other ? encrypt(choices.other) : null,
            }
          : undefined,
      },
      $push: { 'consent.history': { state, at: now, byVisitId } },
    };
    await parentRepository.updateConsent(parentId, update);
    if (state === CONSENT_STATE.DECLINED) {
      await visitRepository.update(visit._id, {
        $set: { status: VISIT_STATUS.PARENT_DECLINED },
        $push: {
          statusHistory: {
            status: VISIT_STATUS.PARENT_DECLINED,
            at: now,
            byUserId: caregiverId,
            reason: 'consent_declined',
          },
        },
      });
    }
    return { state, parentStatus: update.$set.status };
  },

  async saveChecklist(caregiverId, visitId, data) {
    const visit = await getAssignedVisit(caregiverId, visitId);
    if (
      [VISIT_STATUS.COMPLETED, VISIT_STATUS.MISSED, VISIT_STATUS.PARENT_DECLINED].includes(
        visit.status,
      )
    ) {
      throw new ConflictError('STATE_INVALID', 'A checklist cannot be saved for a closed visit.');
    }
    const parent = await parentRepository.findById(visit.parentId);
    if (!parent || parent.consent.state !== CONSENT_STATE.GIVEN) {
      throw new ConflictError(
        'CONSENT_REQUIRED',
        'Consent is required before a visit checklist can be saved.',
      );
    }
    const checklist = {
      ...data,
      completedAt: new Date(),
      note: data.note ? encrypt(data.note) : null,
    };
    const updated = await visitRepository.update(visitId, { $set: { checklist } });
    return serializeVisit(updated);
  },

  async parentDeclined(caregiverId, visitId, { reason, capturedAt }) {
    const visit = await getAssignedVisit(caregiverId, visitId);
    const parent = await parentRepository.findById(visit.parentId);
    if (!parent) throw new NotFoundError();
    const updated = await visitRepository.update(visit._id, {
      $set: { status: VISIT_STATUS.PARENT_DECLINED },
      $push: {
        statusHistory: {
          status: VISIT_STATUS.PARENT_DECLINED,
          at: capturedAt,
          byUserId: caregiverId,
          reason: reason ?? null,
        },
      },
    });
    await notifyRecipient({
      recipientId: parent.clientId,
      targetId: visit._id,
      type: 'visit_parent_declined',
      values: { parentName: parent.name },
    });
    return serializeVisit(updated);
  },

  async createMediaPermit(caregiverId, visitId, { items }) {
    const visit = await getAssignedVisit(caregiverId, visitId);
    if (
      [VISIT_STATUS.COMPLETED, VISIT_STATUS.MISSED, VISIT_STATUS.PARENT_DECLINED].includes(
        visit.status,
      )
    ) {
      throw new ConflictError(
        'STATE_INVALID',
        'A media permit cannot be issued for a closed visit.',
      );
    }
    return {
      permits: items.map((item) =>
        cloudinaryMediaStorage.createUploadPermit({ visitId: visit._id.toString(), ...item }),
      ),
    };
  },

  async complete(caregiverId, visitId, { clientVisitId, media, completedAt }) {
    const visit = await getAssignedVisit(caregiverId, visitId);
    if (visit.clientVisitId !== clientVisitId) {
      throw new ConflictError('STATE_INVALID', 'The visit sync ID does not match this visit.');
    }
    if ([VISIT_STATUS.COMPLETED, VISIT_STATUS.FLAGGED].includes(visit.status)) {
      return serializeVisit(visit);
    }
    if (!visit.checklist || !media.length) {
      throw new ValidationError(
        'Checklist and at least one photo are required to complete a visit',
        {
          form: ['Save the checklist and capture at least one photo before completing the visit.'],
        },
      );
    }
    const parent = await parentRepository.findById(visit.parentId);
    if (!parent || parent.consent.state !== CONSENT_STATE.GIVEN) {
      throw new ConflictError(
        'CONSENT_REQUIRED',
        'Consent is required before a visit can be completed.',
      );
    }
    const uploadDelayed = media.some(
      (item) =>
        new Date(item.uploadedAt).getTime() - new Date(item.capturedAt).getTime() >
        UPLOAD_FLAG_DELAY_MS,
    );
    const status = uploadDelayed ? VISIT_STATUS.FLAGGED : VISIT_STATUS.COMPLETED;
    const updated = await visitRepository.update(visit._id, {
      $set: {
        status,
        media,
        ...(uploadDelayed
          ? {
              statusBeforeFlag: VISIT_STATUS.COMPLETED,
              flag: { reason: 'UPLOAD_DELAYED', raisedAt: new Date() },
            }
          : {}),
      },
      $push: {
        statusHistory: {
          $each: [
            { status: VISIT_STATUS.COMPLETED, at: completedAt, byUserId: caregiverId },
            ...(uploadDelayed
              ? [
                  {
                    status: VISIT_STATUS.FLAGGED,
                    at: new Date(),
                    byUserId: caregiverId,
                    reason: 'UPLOAD_DELAYED',
                  },
                ]
              : []),
          ],
        },
      },
    });
    const caregiver = await userRepository.findById(caregiverId);
    if (!caregiver) throw new NotFoundError();
    await notifyRecipient({
      recipientId: parent.clientId,
      targetId: updated._id,
      type: 'visit_completed',
      values: { caregiverName: caregiver.name, parentName: parent.name },
    });
    if (uploadDelayed) {
      const admins = await userRepository.findAdmins();
      await Promise.all(
        admins.map((admin) =>
          notifyRecipient({
            recipientId: admin._id,
            targetId: updated._id,
            type: 'flag_raised',
            values: { parentName: parent.name, reason: 'UPLOAD_DELAYED' },
          }),
        ),
      );
    }
    return serializeVisit(updated);
  },

  async feed(clientId, parentId, limit = 20) {
    const parent = await parentRepository.findById(parentId);
    if (!parent) throw new NotFoundError();
    if (parent.clientId.toString() !== clientId) throw new ForbiddenError();
    const visits = await visitRepository.findFeedByParent(parentId, limit);
    return {
      items: visits.map((visit) => ({
        visitId: visit._id.toString(),
        scheduledAt: visit.scheduledAt,
        status: visit.status,
        checklistSummary: visit.checklist
          ? {
              medicationTaken: visit.checklist.medicationTaken,
              mood: visit.checklist.mood,
              concerns: visit.checklist.concerns,
            }
          : null,
        media: visit.media.map((media) => {
          const playback = cloudinaryMediaStorage.createVisitMediaPlaybackUrl({
            mediaRef: media.ref,
          });
          return {
            capturedAt: media.capturedAt,
            fullUrl: playback.url,
            sourceFlag: media.sourceFlag,
            thumbUrl: playback.url,
            uploadedAt: media.uploadedAt,
            uploading: false,
          };
        }),
        missedReason:
          visit.status === VISIT_STATUS.MISSED
            ? (visit.statusHistory.at(-1)?.reason ?? null)
            : null,
        makeUpPlan: visit.status === VISIT_STATUS.MISSED ? visit.makeUpPlan : null,
      })),
      nextCursor: null,
    };
  },
});
