import {
  APPLICATION_DECISIONS,
  CAREGIVER_STATUS,
  REFERENCE_OUTCOMES,
  VISIT_STATUS,
} from '../config/constants.js';
import { auditRepository } from '../repositories/audit.repo.js';
import { caregiverRepository } from '../repositories/caregiver.repo.js';
import { parentRepository } from '../repositories/parent.repo.js';
import { visitRepository } from '../repositories/visit.repo.js';
import { ConflictError, NotFoundError } from '../utils/AppError.js';
import { decrypt, encrypt } from '../utils/crypto.js';

function decryptOptional(value) {
  return value ? decrypt(value) : null;
}

function gateRecord(record = {}) {
  return {
    recordedAt: record.recordedAt ?? null,
    recordedBy: record.recordedBy?.toString() ?? null,
    note: decryptOptional(record.note),
  };
}

function serializeApplication(profile, { includeSensitive = false } = {}) {
  const applicant = profile.userId;
  const base = {
    id: profile._id.toString(),
    applicant: { id: applicant._id.toString(), name: applicant.name },
    serviceArea: {
      lng: profile.serviceArea.coordinates[0],
      lat: profile.serviceArea.coordinates[1],
      radiusKm: profile.serviceArea.radiusKm,
    },
    status: profile.status,
    gates: profile.verification.gates,
    createdAt: profile.createdAt,
  };
  if (!includeSensitive) return base;
  return {
    ...base,
    applicant: { ...base.applicant, email: applicant.email, phone: applicant.phone },
    verification: {
      cnicNumber: decryptOptional(profile.verification.cnicNumber),
      cnicDocRef: decryptOptional(profile.verification.cnicDocRef),
      interviewRecordingRef: decryptOptional(profile.verification.interviewRecordingRef),
      referenceOutcome: profile.verification.referenceOutcome,
      gateRecords: {
        cnic: gateRecord(profile.verification.gateRecords?.cnic),
        interview: gateRecord(profile.verification.gateRecords?.interview),
        reference: gateRecord(profile.verification.gateRecords?.reference),
      },
      decidedAt: profile.verification.decidedAt,
      decidedBy: profile.verification.decidedBy?.toString() ?? null,
    },
  };
}

async function applicationOrThrow(applicationId) {
  const application = await caregiverRepository.findApplicationById(applicationId);
  if (!application) throw new NotFoundError();
  return application;
}

async function audit(actorId, action, applicationId, detail) {
  await auditRepository.create({
    actorId,
    action,
    at: new Date(),
    detail,
    targetId: applicationId,
    targetType: 'caregiverProfile',
  });
}

function gateUpdate({ actorId, gate, note, passed }) {
  return {
    $set: {
      [`verification.gates.${gate}`]: passed,
      [`verification.gateRecords.${gate}`]: {
        recordedAt: new Date(),
        recordedBy: actorId,
        note: note ? encrypt(note) : null,
      },
      status: CAREGIVER_STATUS.IN_REVIEW,
    },
  };
}

function startOfLocalDay(now = new Date()) {
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { end, start };
}

function distanceKm(first, second) {
  const [firstLng, firstLat] = first;
  const [secondLng, secondLat] = second;
  const radians = (degrees) => (degrees * Math.PI) / 180;
  const latDistance = radians(secondLat - firstLat);
  const lngDistance = radians(secondLng - firstLng);
  const value =
    Math.sin(latDistance / 2) ** 2 +
    Math.cos(radians(firstLat)) * Math.cos(radians(secondLat)) * Math.sin(lngDistance / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value));
}

function isInServiceArea(caregiver, parent) {
  return (
    distanceKm(caregiver.serviceArea.coordinates, parent.location.coordinates) <=
    caregiver.serviceArea.radiusKm
  );
}

function serializedFlag(flag) {
  if (!flag) return null;
  return {
    reason: flag.reason,
    raisedAt: flag.raisedAt,
    resolvedAt: flag.resolvedAt,
    resolvedBy: flag.resolvedBy?.toString() ?? null,
    note: decryptOptional(flag.note),
  };
}

function serializeOversightVisit(visit) {
  return {
    id: visit._id.toString(),
    caregiverId: visit.caregiverId?._id?.toString() ?? visit.caregiverId?.toString() ?? null,
    caregiver: visit.caregiverId
      ? { id: visit.caregiverId._id.toString(), name: visit.caregiverId.name }
      : null,
    flag: serializedFlag(visit.flag),
    parent: visit.parentId
      ? { id: visit.parentId._id.toString(), name: visit.parentId.name }
      : null,
    scheduledAt: visit.scheduledAt,
    status: visit.status,
  };
}

function serializeVisitEvidence(visit) {
  const base = serializeOversightVisit(visit);
  return {
    ...base,
    addressText: visit.parentId ? decryptOptional(visit.parentId.addressText) : null,
    checklist: visit.checklist
      ? {
          capturedAt: visit.checklist.capturedAt,
          completedAt: visit.checklist.completedAt,
          concerns: visit.checklist.concerns,
          medicationTaken: visit.checklist.medicationTaken,
          mood: visit.checklist.mood,
          note: decryptOptional(visit.checklist.note),
        }
      : null,
    media: visit.media.map((media) => ({
      capturedAt: media.capturedAt,
      clientMediaId: media.clientMediaId,
      ref: media.ref,
      sourceFlag: media.sourceFlag,
      uploadedAt: media.uploadedAt,
    })),
    statusBeforeFlag: visit.statusBeforeFlag,
    statusHistory: visit.statusHistory.map((entry) => ({
      at: entry.at,
      byUserId: entry.byUserId?.toString() ?? null,
      reason: entry.reason,
      status: entry.status,
    })),
  };
}

function serializeSuggestion({ caregiver, continuity, inArea, todayScheduledCount }) {
  const verified = caregiver.status === CAREGIVER_STATUS.VERIFIED;
  return {
    caregiverId: caregiver.userId._id.toString(),
    continuity,
    inArea,
    name: caregiver.userId.name,
    assignable: verified && inArea,
    todayScheduledCount,
    blockedReason: !verified
      ? 'This caregiver is not verified.'
      : !inArea
        ? 'This caregiver’s service area does not cover the parent location.'
        : null,
  };
}

export const adminService = Object.freeze({
  async listApplications({ limit = 20, page = 1, status }) {
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      caregiverRepository.listApplications({ limit, skip, status }),
      caregiverRepository.countApplications(status),
    ]);
    return { items: items.map((application) => serializeApplication(application)), page, total };
  },

  async getApplication(actorId, applicationId) {
    const application = await applicationOrThrow(applicationId);
    await audit(actorId, 'cnic.viewed', application._id, {});
    return serializeApplication(application, { includeSensitive: true });
  },

  async recordCnicGate(actorId, applicationId, { cnicDocRef, note, verified }) {
    const application = await applicationOrThrow(applicationId);
    const update = gateUpdate({ actorId, gate: 'cnic', note, passed: verified });
    update.$set['verification.cnicDocRef'] = encrypt(cnicDocRef);
    const updated = await caregiverRepository.updateApplication(application._id, update);
    await audit(actorId, 'caregiver.cnic_gate_recorded', application._id, { verified });
    return serializeApplication(updated, { includeSensitive: true });
  },

  async recordInterviewGate(actorId, applicationId, { interviewRecordingRef, note, passed }) {
    const application = await applicationOrThrow(applicationId);
    const update = gateUpdate({ actorId, gate: 'interview', note, passed });
    if (interviewRecordingRef) {
      update.$set['verification.interviewRecordingRef'] = encrypt(interviewRecordingRef);
    }
    const updated = await caregiverRepository.updateApplication(application._id, update);
    await audit(actorId, 'caregiver.interview_gate_recorded', application._id, { passed });
    return serializeApplication(updated, { includeSensitive: true });
  },

  async recordReferenceGate(actorId, applicationId, { note, referenceOutcome }) {
    const application = await applicationOrThrow(applicationId);
    const passed = referenceOutcome === REFERENCE_OUTCOMES.POSITIVE;
    const update = gateUpdate({ actorId, gate: 'reference', note, passed });
    update.$set['verification.referenceOutcome'] = referenceOutcome;
    const updated = await caregiverRepository.updateApplication(application._id, update);
    await audit(actorId, 'caregiver.reference_gate_recorded', application._id, {
      referenceOutcome,
    });
    return serializeApplication(updated, { includeSensitive: true });
  },

  async decideApplication(actorId, applicationId, { decision, note }) {
    const application = await applicationOrThrow(applicationId);
    const { gates } = application.verification;
    if (
      decision === APPLICATION_DECISIONS.APPROVE &&
      (!gates.cnic || !gates.interview || !gates.reference)
    ) {
      throw new ConflictError('STATE_INVALID', 'Verification gates incomplete');
    }
    const status =
      decision === APPLICATION_DECISIONS.APPROVE
        ? CAREGIVER_STATUS.VERIFIED
        : decision === APPLICATION_DECISIONS.REJECT
          ? CAREGIVER_STATUS.REJECTED
          : CAREGIVER_STATUS.IN_REVIEW;
    const updated = await caregiverRepository.updateApplication(application._id, {
      $set: {
        status,
        'verification.decidedAt': new Date(),
        'verification.decidedBy': actorId,
      },
    });
    await audit(actorId, `caregiver.${decision}`, application._id, {
      note: note ? encrypt(note) : null,
    });
    return serializeApplication(updated, { includeSensitive: true });
  },

  async assignmentSuggestions(visitId, now = new Date()) {
    const visit = await visitRepository.findById(visitId);
    if (!visit) throw new NotFoundError();
    const [parent, previous] = await Promise.all([
      parentRepository.findById(visit.parentId),
      visitRepository.findMostRecentAssignedCaregiverForParent(visit.parentId, visit.scheduledAt),
    ]);
    if (!parent) throw new NotFoundError();

    const verifiedCaregivers = await caregiverRepository.findVerifiedForAssignment();
    const previousCaregiverId = previous?.caregiverId?.toString() ?? null;
    const profilesByUserId = new Map(
      verifiedCaregivers.map((caregiver) => [caregiver.userId._id.toString(), caregiver]),
    );
    if (previousCaregiverId && !profilesByUserId.has(previousCaregiverId)) {
      const [previousProfile] = await caregiverRepository.findByUserIds([previousCaregiverId]);
      if (previousProfile) profilesByUserId.set(previousCaregiverId, previousProfile);
    }

    const { end, start } = startOfLocalDay(now);
    const verifiedIds = verifiedCaregivers.map((caregiver) => caregiver.userId._id);
    const counts = await visitRepository.countScheduledTodayByCaregiverIds(verifiedIds, start, end);
    const loads = new Map(counts.map((item) => [item._id.toString(), item.count]));

    const previousProfile = previousCaregiverId ? profilesByUserId.get(previousCaregiverId) : null;
    const inAreaCandidates = verifiedCaregivers
      .filter((caregiver) => caregiver.userId._id.toString() !== previousCaregiverId)
      .filter((caregiver) => isInServiceArea(caregiver, parent))
      .sort(
        (first, second) =>
          (loads.get(first.userId._id.toString()) ?? 0) -
            (loads.get(second.userId._id.toString()) ?? 0) ||
          first.userId.name.localeCompare(second.userId.name),
      );

    return {
      items: [
        ...(previousProfile
          ? [
              serializeSuggestion({
                caregiver: previousProfile,
                continuity: true,
                inArea: isInServiceArea(previousProfile, parent),
                todayScheduledCount: loads.get(previousCaregiverId) ?? 0,
              }),
            ]
          : []),
        ...inAreaCandidates.map((caregiver) =>
          serializeSuggestion({
            caregiver,
            continuity: false,
            inArea: true,
            todayScheduledCount: loads.get(caregiver.userId._id.toString()) ?? 0,
          }),
        ),
      ],
    };
  },

  async assignVisit(actorId, visitId, caregiverId) {
    const [visit, caregiver] = await Promise.all([
      visitRepository.findById(visitId),
      caregiverRepository.findByUserIds([caregiverId]),
    ]);
    if (!visit) throw new NotFoundError();
    const profile = caregiver[0];
    if (!profile || profile.status !== CAREGIVER_STATUS.VERIFIED) {
      throw new ConflictError('STATE_INVALID', 'The caregiver must be verified before assignment.');
    }
    const parent = await parentRepository.findById(visit.parentId);
    if (!parent) throw new NotFoundError();
    if (!isInServiceArea(profile, parent)) {
      throw new ConflictError(
        'STATE_INVALID',
        'The caregiver service area does not cover this parent.',
      );
    }
    const reassigned = Boolean(visit.caregiverId);
    const updated = await visitRepository.update(visit._id, { $set: { caregiverId } });
    await audit(actorId, reassigned ? 'visit.reassigned' : 'visit.assigned', visit._id, {
      caregiverId,
    });
    return serializeOversightVisit(await visitRepository.findByIdForAdmin(updated._id));
  },

  async listVisits({ limit = 20, page = 1, ...filters }) {
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      visitRepository.findForAdmin({ ...filters, limit, skip }),
      visitRepository.countForAdmin(filters),
    ]);
    return { items: items.map(serializeOversightVisit), page, total };
  },

  async getVisitEvidence(actorId, visitId) {
    const visit = await visitRepository.findByIdForAdmin(visitId);
    if (!visit) throw new NotFoundError();
    await audit(actorId, 'visit.viewed', visit._id, {});
    return serializeVisitEvidence(visit);
  },

  async resolveFlag(actorId, visitId, { note }) {
    const visit = await visitRepository.findByIdForAdmin(visitId);
    if (!visit) throw new NotFoundError();
    if (!visit.flag || visit.flag.resolvedAt || visit.status !== VISIT_STATUS.FLAGGED) {
      throw new ConflictError('STATE_INVALID', 'This visit does not have an open flag to resolve.');
    }
    if (!visit.statusBeforeFlag) {
      throw new ConflictError('STATE_INVALID', 'This flag has no recorded prior visit status.');
    }
    const now = new Date();
    const restoredStatus = visit.statusBeforeFlag;
    const updated = await visitRepository.update(visit._id, {
      $set: {
        status: restoredStatus,
        'flag.note': encrypt(note),
        'flag.resolvedAt': now,
        'flag.resolvedBy': actorId,
      },
      $push: {
        statusHistory: {
          status: restoredStatus,
          at: now,
          byUserId: actorId,
          reason: 'flag_resolved',
        },
      },
    });
    await audit(actorId, 'visit.flag_resolved', visit._id, {});
    return serializeVisitEvidence(await visitRepository.findByIdForAdmin(updated._id));
  },
});
