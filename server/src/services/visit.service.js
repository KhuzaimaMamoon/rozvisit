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

function startOfWeek(date) {
  const value = new Date(date);
  value.setHours(0, 0, 0, 0);
  value.setDate(value.getDate() - value.getDay());
  return value;
}

function dateForSlot(now, dayOfWeek, time) {
  const [hours, minutes] = time.split(':').map(Number);
  const date = startOfWeek(now);
  date.setDate(date.getDate() + dayOfWeek);
  date.setHours(hours, minutes, 0, 0);
  return date;
}

function weekKey(date) {
  return startOfWeek(date).toISOString();
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
    const periodEnd =
      subscription.currentPeriodEnd ??
      new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());
    const records = [];
    for (const week = startOfWeek(now); week < periodEnd; week.setDate(week.getDate() + 7)) {
      for (const slot of slots) {
        const scheduledAt = dateForSlot(week, slot.dayOfWeek, slot.time);
        if (scheduledAt < now || scheduledAt >= periodEnd) continue;
        records.push({
          clientVisitId: crypto
            .createHash('sha256')
            .update(`${parentId}:${subscription._id.toString()}:${scheduledAt.toISOString()}`)
            .digest('hex'),
          parentId,
          caregiverId: null,
          subscriptionId: subscription._id,
          scheduledAt,
          standingNote: standingNote ?? null,
          status: VISIT_STATUS.SCHEDULED,
          statusHistory: [{ status: VISIT_STATUS.SCHEDULED, at: now, byUserId: clientId }],
        });
      }
    }
    const existingVisits = await visitRepository.findForSubscriptionPeriod(
      subscription._id,
      startOfWeek(now),
      periodEnd,
    );
    const existingIds = new Set(existingVisits.map((visit) => visit.clientVisitId));
    const occupiedByWeek = new Map();
    for (const visit of existingVisits) {
      if (![VISIT_STATUS.SCHEDULED, VISIT_STATUS.COMPLETED].includes(visit.status)) continue;
      const key = weekKey(visit.scheduledAt);
      occupiedByWeek.set(key, (occupiedByWeek.get(key) ?? 0) + 1);
    }
    for (const record of records) {
      if (existingIds.has(record.clientVisitId)) continue;
      const key = weekKey(record.scheduledAt);
      const nextCount = (occupiedByWeek.get(key) ?? 0) + 1;
      if (nextCount > limit) {
        throw new ConflictError(
          'ALLOWANCE_EXCEEDED',
          `Your plan includes ${limit} visits per week. Upgrade to add more.`,
        );
      }
      occupiedByWeek.set(key, nextCount);
    }
    const visits = records.length ? await visitRepository.upsertScheduled(records) : [];
    return {
      items: visits.map(serializeVisit),
      message: 'Your visit is scheduled and a caregiver will be assigned shortly.',
    };
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
        media: visit.media.map((media) => ({
          ref: media.ref,
          capturedAt: media.capturedAt,
          uploadedAt: media.uploadedAt,
          sourceFlag: media.sourceFlag,
        })),
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
