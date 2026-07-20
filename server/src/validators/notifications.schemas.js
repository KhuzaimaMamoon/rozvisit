function failure(fields) {
  return { success: false, error: { flatten: () => ({ fieldErrors: fields }) } };
}

function asPositiveInteger(value, fallback, field, fields) {
  const parsed = value === undefined ? fallback : Number(value);
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 100) {
    fields[field] = ['Choose a whole number from 1 to 100.'];
  }
  return parsed;
}

export const notificationListQuerySchema = {
  safeParse(value) {
    const fields = {};
    const before = value.before || undefined;
    if (before && Number.isNaN(new Date(before).getTime())) {
      fields.before = ['Enter a valid notification cursor.'];
    }
    const limit = asPositiveInteger(value.limit, 20, 'limit', fields);
    return Object.keys(fields).length
      ? failure(fields)
      : { success: true, data: { before, limit } };
  },
};

export const notificationFailuresQuerySchema = {
  safeParse(value) {
    const fields = {};
    const limit = asPositiveInteger(value.limit, 20, 'limit', fields);
    const page = asPositiveInteger(value.page, 1, 'page', fields);
    return Object.keys(fields).length ? failure(fields) : { success: true, data: { limit, page } };
  },
};
