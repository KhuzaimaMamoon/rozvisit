const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^\+[1-9]\d{1,14}$/;
const COUNTRY_PATTERN = /^[A-Z]{2}$/;
const CNIC_PATTERN = /^\d{13}$/;

function failure(fields) {
  return { success: false, error: { flatten: () => ({ fieldErrors: fields }) } };
}

function parseObject(value, checks) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return failure({ form: ['Please provide the required details.'] });
  }

  const fields = {};
  const data = {};
  for (const [key, check] of Object.entries(checks)) {
    const result = check(value[key]);
    if (result.message) fields[key] = [result.message];
    else data[key] = result.value;
  }
  return Object.keys(fields).length ? failure(fields) : { success: true, data };
}

const name = (value) => {
  const normalized = typeof value === 'string' ? value.trim() : '';
  return normalized.length >= 2 && normalized.length <= 100
    ? { value: normalized }
    : { message: 'Please enter a name between 2 and 100 characters.' };
};
const email = (value) => {
  const normalized = typeof value === 'string' ? value.trim().toLowerCase() : '';
  return EMAIL_PATTERN.test(normalized)
    ? { value: normalized }
    : { message: 'Please enter a valid email address.' };
};
const phone = (value) =>
  typeof value === 'string' && PHONE_PATTERN.test(value)
    ? { value }
    : { message: 'Include your country code, for example +971501234567.' };
const countryCode = (value) => {
  const normalized = typeof value === 'string' ? value.trim().toUpperCase() : '';
  return COUNTRY_PATTERN.test(normalized)
    ? { value: normalized }
    : { message: 'Please enter a two-letter country code, for example AE.' };
};
const password = (value) =>
  typeof value === 'string' &&
  value.length >= 8 &&
  value.length <= 128 &&
  /[A-Za-z]/.test(value) &&
  /\d/.test(value)
    ? { value }
    : { message: 'Use 8–128 characters with at least one letter and one number.' };
const token = (value) =>
  typeof value === 'string' && value.length > 0
    ? { value }
    : { message: 'This link is not valid. Please request a new one.' };

export const registerSchema = {
  safeParse: (value) => parseObject(value, { name, email, phone, countryCode, password }),
};
export const loginSchema = { safeParse: (value) => parseObject(value, { email, password }) };
export const emailSchema = { safeParse: (value) => parseObject(value, { email }) };
export const verifySchema = { safeParse: (value) => parseObject(value, { token }) };
export const resetSchema = {
  safeParse: (value) => parseObject(value, { token, newPassword: password }),
};
export const applySchema = {
  safeParse: (value) =>
    parseObject(value, {
      name,
      email,
      phone,
      password,
      cnicNumber: (cnic) =>
        typeof cnic === 'string' && CNIC_PATTERN.test(cnic)
          ? { value: cnic }
          : { message: 'Please enter a 13-digit CNIC number.' },
      serviceArea: (area) => {
        const valid =
          area &&
          typeof area === 'object' &&
          Number.isFinite(area.lng) &&
          Number.isFinite(area.lat) &&
          Number.isFinite(area.radiusKm) &&
          area.lng >= -180 &&
          area.lng <= 180 &&
          area.lat >= -90 &&
          area.lat <= 90 &&
          area.radiusKm > 0;
        return valid
          ? { value: { lng: area.lng, lat: area.lat, radiusKm: area.radiusKm } }
          : { message: 'Please enter a valid service area and radius.' };
      },
    }),
};
