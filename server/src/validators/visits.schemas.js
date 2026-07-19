function failure(fields) {
  return { success: false, error: { flatten: () => ({ fieldErrors: fields }) } };
}

function validDate(value) {
  return typeof value === 'string' && !Number.isNaN(new Date(value).getTime());
}

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
    if (!Array.isArray(value?.concerns) || value.concerns.some((item) => typeof item !== 'string'))
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
