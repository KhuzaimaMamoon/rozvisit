function failure(fields) {
  return { success: false, error: { flatten: () => ({ fieldErrors: fields }) } };
}

function validDate(value) {
  return typeof value === 'string' && !Number.isNaN(new Date(value).getTime());
}

export const caregiverVisitsQuerySchema = {
  safeParse(value) {
    const fields = {};
    const before = value.before || undefined;
    if (before && !validDate(before)) fields.before = ['Enter a valid visit cursor.'];
    const limit = value.limit === undefined ? 20 : Number(value.limit);
    if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
      fields.limit = ['Choose a whole number from 1 to 100.'];
    }
    return Object.keys(fields).length
      ? failure(fields)
      : { success: true, data: { before: before ? new Date(before) : null, limit } };
  },
};

import { VISIT_CONCERN_CHIPS } from '../config/constants.js';

export const scheduleVisitsSchema = {
  safeParse(value) {
    const fields = {};
    if (!value || typeof value !== 'object' || Array.isArray(value))
      return failure({ form: ['Please provide visit slots.'] });
    if (typeof value.parentId !== 'string' || !value.parentId)
      fields.parentId = ['Choose a parent.'];
    if (!Array.isArray(value.slots) || value.slots.length === 0)
      fields.slots = ['Add at least one weekly slot.'];
    const slots = Array.isArray(value.slots) ? value.slots : [];
    if (
      slots.some(
        (slot) =>
          !Number.isInteger(slot.dayOfWeek) ||
          slot.dayOfWeek < 0 ||
          slot.dayOfWeek > 6 ||
          !/^([01]\d|2[0-3]):[0-5]\d$/.test(slot.time ?? ''),
      )
    )
      fields.slots = ['Use a weekday and a valid time for every slot.'];
    return Object.keys(fields).length
      ? failure(fields)
      : {
          success: true,
          data: {
            parentId: value.parentId,
            slots,
            standingNote: typeof value.standingNote === 'string' ? value.standingNote.trim() : null,
          },
        };
  },
};

export const assignCaregiverSchema = {
  safeParse(value) {
    return typeof value?.caregiverId === 'string' && value.caregiverId
      ? { success: true, data: { caregiverId: value.caregiverId } }
      : failure({ caregiverId: ['Choose a verified caregiver.'] });
  },
};

export const consentSchema = {
  safeParse(value) {
    const fields = {};
    if (!['given', 'declined'].includes(value?.state))
      fields.state = ['Choose whether consent was given or declined.'];
    if (value?.state === 'given' && (typeof value.recordingRef !== 'string' || !value.recordingRef))
      fields.recordingRef = ['A consent recording reference is required.'];
    if (typeof value?.byVisitId !== 'string' || !value.byVisitId)
      fields.byVisitId = ['The first visit is required.'];
    return Object.keys(fields).length ? failure(fields) : { success: true, data: value };
  },
};

export const checklistSchema = {
  safeParse(value) {
    const fields = {};
    if (typeof value?.medicationTaken !== 'boolean') fields.medicationTaken = ['Choose yes or no.'];
    if (!Number.isInteger(value?.mood) || value.mood < 1 || value.mood > 5)
      fields.mood = ['Choose a mood from 1 to 5.'];
    if (
      !Array.isArray(value?.concerns) ||
      value.concerns.some((item) => !Object.values(VISIT_CONCERN_CHIPS).includes(item))
    )
      fields.concerns = ['Choose supported concern options.'];
    if (!validDate(value?.capturedAt)) fields.capturedAt = ['A capture time is required.'];
    return Object.keys(fields).length
      ? failure(fields)
      : {
          success: true,
          data: {
            ...value,
            note: typeof value.note === 'string' ? value.note : null,
            capturedAt: new Date(value.capturedAt),
          },
        };
  },
};

export const parentDeclinedSchema = {
  safeParse(value) {
    return validDate(value?.capturedAt)
      ? {
          success: true,
          data: {
            reason: typeof value.reason === 'string' ? value.reason : null,
            capturedAt: new Date(value.capturedAt),
          },
        }
      : failure({ capturedAt: ['A capture time is required.'] });
  },
};

export const consentPermitSchema = {
  safeParse(value) {
    const fields = {};
    if (!['audio', 'video'].includes(value?.mediaType)) {
      fields.mediaType = ['Choose audio or video for the consent recording.'];
    }
    if (typeof value?.byVisitId !== 'string' || !value.byVisitId) {
      fields.byVisitId = ['The assigned first visit is required.'];
    }
    return Object.keys(fields).length
      ? failure(fields)
      : { success: true, data: { byVisitId: value.byVisitId, mediaType: value.mediaType } };
  },
};

export const mediaPermitSchema = {
  safeParse(value) {
    const items = value?.items;
    if (!Array.isArray(items) || items.length < 1 || items.length > 5) {
      return failure({ items: ['Provide one to five captured media items.'] });
    }
    const fields = {};
    const ids = new Set();
    const valid = items.every((item) => {
      if (typeof item?.clientMediaId !== 'string' || !item.clientMediaId.trim()) return false;
      if (ids.has(item.clientMediaId)) return false;
      ids.add(item.clientMediaId);
      return validDate(item.capturedAt) && ['photo', 'video'].includes(item.mediaType);
    });
    if (!valid)
      fields.items = ['Every item needs a unique device media ID, capture time, and type.'];
    return Object.keys(fields).length
      ? failure(fields)
      : {
          success: true,
          data: {
            items: items.map((item) => ({
              clientMediaId: item.clientMediaId.trim(),
              capturedAt: new Date(item.capturedAt),
              mediaType: item.mediaType,
            })),
          },
        };
  },
};

export const completeVisitSchema = {
  safeParse(value) {
    const fields = {};
    if (typeof value?.clientVisitId !== 'string' || !value.clientVisitId)
      fields.clientVisitId = ['A visit sync ID is required.'];
    if (!validDate(value?.completedAt)) fields.completedAt = ['A completion time is required.'];
    if (!Array.isArray(value?.media) || value.media.length < 1) {
      fields.media = ['At least one in-app camera photo is required.'];
    } else if (
      value.media.some(
        (item) =>
          typeof item?.clientMediaId !== 'string' ||
          typeof item?.ref !== 'string' ||
          !item.ref ||
          !validDate(item.capturedAt) ||
          !validDate(item.uploadedAt) ||
          item.sourceFlag !== 'in_app_camera',
      )
    ) {
      fields.media = ['Every media item must be captured in the in-app camera.'];
    }
    return Object.keys(fields).length
      ? failure(fields)
      : {
          success: true,
          data: {
            clientVisitId: value.clientVisitId,
            completedAt: new Date(value.completedAt),
            media: value.media.map((item) => ({
              clientMediaId: item.clientMediaId,
              ref: item.ref,
              capturedAt: new Date(item.capturedAt),
              uploadedAt: new Date(item.uploadedAt),
              sourceFlag: item.sourceFlag,
            })),
          },
        };
  },
};
