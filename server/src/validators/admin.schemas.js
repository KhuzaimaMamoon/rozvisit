import {
  APPLICATION_DECISIONS,
  CAREGIVER_STATUS,
  REFERENCE_OUTCOMES,
  VISIT_STATUS,
} from '../config/constants.js';
import mongoose from 'mongoose';

function failure(fields) {
  return { success: false, error: { flatten: () => ({ fieldErrors: fields }) } };
}

function object(value, message) {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? null
    : failure({ form: [message] });
}

function optionalNote(value, fields) {
  if (value === undefined) return null;
  if (typeof value !== 'string' || value.trim().length > 1000) {
    fields.note = ['Enter a note of up to 1,000 characters.'];
    return null;
  }
  return value.trim() || null;
}

export const cnicGateSchema = {
  safeParse(value) {
    const invalid = object(value, 'Please provide the CNIC gate details.');
    if (invalid) return invalid;
    const fields = {};
    if (typeof value.cnicDocRef !== 'string' || !value.cnicDocRef.trim()) {
      fields.cnicDocRef = ['A CNIC document reference is required.'];
    }
    if (typeof value.verified !== 'boolean') {
      fields.verified = ['Confirm whether the CNIC check passed.'];
    }
    const note = optionalNote(value.note, fields);
    return Object.keys(fields).length
      ? failure(fields)
      : {
          success: true,
          data: { cnicDocRef: value.cnicDocRef.trim(), note, verified: value.verified },
        };
  },
};

export const interviewGateSchema = {
  safeParse(value) {
    const invalid = object(value, 'Please provide the interview gate details.');
    if (invalid) return invalid;
    const fields = {};
    if (typeof value.passed !== 'boolean') {
      fields.passed = ['Confirm whether the interview passed.'];
    }
    if (
      value.interviewRecordingRef !== undefined &&
      (typeof value.interviewRecordingRef !== 'string' || !value.interviewRecordingRef.trim())
    ) {
      fields.interviewRecordingRef = ['Enter a valid interview recording reference.'];
    }
    const note = optionalNote(value.note, fields);
    return Object.keys(fields).length
      ? failure(fields)
      : {
          success: true,
          data: {
            interviewRecordingRef: value.interviewRecordingRef?.trim() || null,
            note,
            passed: value.passed,
          },
        };
  },
};

export const referenceGateSchema = {
  safeParse(value) {
    const invalid = object(value, 'Please provide the reference gate details.');
    if (invalid) return invalid;
    const fields = {};
    if (!Object.values(REFERENCE_OUTCOMES).includes(value.referenceOutcome)) {
      fields.referenceOutcome = ['Choose positive, negative, or unreachable.'];
    }
    const note = optionalNote(value.note, fields);
    if (value.referenceOutcome !== REFERENCE_OUTCOMES.POSITIVE && !note) {
      fields.note = ['Explain why this reference did not pass.'];
    }
    return Object.keys(fields).length
      ? failure(fields)
      : { success: true, data: { note, referenceOutcome: value.referenceOutcome } };
  },
};

export const applicationDecisionSchema = {
  safeParse(value) {
    const invalid = object(value, 'Please provide an application decision.');
    if (invalid) return invalid;
    const fields = {};
    if (!Object.values(APPLICATION_DECISIONS).includes(value.decision)) {
      fields.decision = ['Choose approve, reject, or request info.'];
    }
    const note = optionalNote(value.note, fields);
    return Object.keys(fields).length
      ? failure(fields)
      : { success: true, data: { decision: value.decision, note } };
  },
};

export const applicationListQuerySchema = {
  safeParse(value) {
    const fields = {};
    const status = value.status || undefined;
    if (status && ![CAREGIVER_STATUS.APPLIED, CAREGIVER_STATUS.IN_REVIEW].includes(status)) {
      fields.status = ['Choose applied or in review.'];
    }
    const page = value.page === undefined ? 1 : Number(value.page);
    const limit = value.limit === undefined ? 20 : Number(value.limit);
    if (!Number.isInteger(page) || page < 1) fields.page = ['Enter a valid page number.'];
    if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
      fields.limit = ['Choose a limit from 1 to 100.'];
    }
    return Object.keys(fields).length
      ? failure(fields)
      : { success: true, data: { limit, page, status } };
  },
};

export const directoryListQuerySchema = {
  safeParse(value) {
    const fields = {};
    const page = value.page === undefined ? 1 : Number(value.page);
    const limit = value.limit === undefined ? 20 : Number(value.limit);
    const view = value.view || 'active';
    if (!Number.isInteger(page) || page < 1) fields.page = ['Enter a valid page number.'];
    if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
      fields.limit = ['Choose a limit from 1 to 100.'];
    }
    if (!['active', 'archived', 'all'].includes(view)) {
      fields.view = ['Choose active, archived, or all records.'];
    }
    return Object.keys(fields).length
      ? failure(fields)
      : { success: true, data: { limit, page, view } };
  },
};

function validDate(value) {
  return typeof value === 'string' && !Number.isNaN(new Date(value).getTime());
}

export const adminVisitsQuerySchema = {
  safeParse(value) {
    const fields = {};
    const status = value.status || undefined;
    const caregiverId = value.caregiverId || undefined;
    const from = value.from || undefined;
    const to = value.to || undefined;
    const page = value.page === undefined ? 1 : Number(value.page);
    const limit = value.limit === undefined ? 20 : Number(value.limit);
    const view = value.view || 'active';
    if (status && !Object.values(VISIT_STATUS).includes(status)) {
      fields.status = ['Choose a supported visit status.'];
    }
    if (caregiverId && !mongoose.isValidObjectId(caregiverId)) {
      fields.caregiverId = ['Choose a valid caregiver.'];
    }
    if (from && !validDate(from)) fields.from = ['Enter a valid start date.'];
    if (to && !validDate(to)) fields.to = ['Enter a valid end date.'];
    if (from && to && validDate(from) && validDate(to) && new Date(from) > new Date(to)) {
      fields.to = ['The end date must be after the start date.'];
    }
    if (!Number.isInteger(page) || page < 1) fields.page = ['Enter a valid page number.'];
    if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
      fields.limit = ['Choose a limit from 1 to 100.'];
    }
    if (!['active', 'archived', 'all'].includes(view)) {
      fields.view = ['Choose active, archived, or all records.'];
    }
    return Object.keys(fields).length
      ? failure(fields)
      : {
          success: true,
          data: {
            caregiverId,
            from: from ? new Date(from) : undefined,
            limit,
            page,
            status,
            to: to ? new Date(to) : undefined,
            view,
          },
        };
  },
};

export const archiveSchema = {
  safeParse(value) {
    const invalid = object(value, 'Please provide an archive reason.');
    if (invalid) return invalid;
    const reason = typeof value.reason === 'string' ? value.reason.trim() : '';
    return reason && reason.length <= 500
      ? { success: true, data: { reason } }
      : failure({ reason: ['Explain why this record is being archived (up to 500 characters).'] });
  },
};

export const resolveFlagSchema = {
  safeParse(value) {
    const invalid = object(value, 'Please provide a flag-resolution note.');
    if (invalid) return invalid;
    const fields = {};
    const note = optionalNote(value.note, fields);
    if (!note) fields.note ??= ['Explain how this flag was resolved.'];
    return Object.keys(fields).length ? failure(fields) : { success: true, data: { note } };
  },
};

export const markMissedSchema = {
  safeParse(value) {
    const invalid = object(value, 'Please provide the missed-visit details.');
    if (invalid) return invalid;
    const fields = {};
    if (typeof value.reason !== 'string' || !value.reason.trim()) {
      fields.reason = ['Explain why this visit was missed.'];
    }
    if (
      value.makeUpPlan !== undefined &&
      value.makeUpPlan !== null &&
      typeof value.makeUpPlan !== 'string'
    ) {
      fields.makeUpPlan = ['Enter a make-up plan or leave this field blank.'];
    }
    return Object.keys(fields).length
      ? failure(fields)
      : {
          success: true,
          data: {
            makeUpPlan: value.makeUpPlan?.trim() || null,
            reason: value.reason.trim(),
          },
        };
  },
};
