import {
  APPLICATION_DECISIONS,
  CAREGIVER_STATUS,
  REFERENCE_OUTCOMES,
} from '../config/constants.js';
import { auditRepository } from '../repositories/audit.repo.js';
import { caregiverRepository } from '../repositories/caregiver.repo.js';
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
});
