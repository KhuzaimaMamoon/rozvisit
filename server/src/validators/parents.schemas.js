const PHONE_PATTERN = /^\+[1-9]\d{1,14}$/;

function failure(fields) {
  return { success: false, error: { flatten: () => ({ fieldErrors: fields }) } };
}

function text(value, field, { optional = false } = {}) {
  if (optional && (value === undefined || value === null || value === ''))
    return { value: undefined };
  const normalized = typeof value === 'string' ? value.trim() : '';
  return normalized ? { value: normalized } : { message: `Please enter ${field}.` };
}

function mapLink(value, { optional = false } = {}) {
  if (optional && value === undefined) return { value: undefined };
  let url;
  try {
    url = new URL(typeof value === 'string' ? value.trim() : '');
  } catch {
    return { message: 'Paste a complete Google Maps share link beginning with https://.' };
  }
  const host = url.hostname.toLowerCase();
  const googleHost =
    host === 'google.com' || host.endsWith('.google.com') || host === 'maps.app.goo.gl';
  return url.protocol === 'https:' && googleHost
    ? { value: url.href }
    : { message: 'Use a Google Maps share link from maps.google.com or maps.app.goo.gl.' };
}

function contacts(value) {
  if (!Array.isArray(value) || value.length < 1)
    return { message: 'Add at least one emergency contact.' };
  const priorities = new Set();
  const normalized = [];
  for (const contact of value) {
    const name = text(contact?.name, 'the contact name');
    const relation = text(contact?.relation, 'the relationship');
    const phone =
      typeof contact?.phone === 'string' && PHONE_PATTERN.test(contact.phone)
        ? { value: contact.phone }
        : { message: 'Include each contact’s country code.' };
    const priority =
      Number.isInteger(contact?.priority) && contact.priority >= 1
        ? { value: contact.priority }
        : { message: 'Use a positive whole-number priority.' };
    if (name.message || relation.message || phone.message || priority.message)
      return { message: 'Please complete every emergency contact.' };
    if (priorities.has(priority.value))
      return { message: 'Each emergency-contact priority must be unique.' };
    priorities.add(priority.value);
    normalized.push({
      name: name.value,
      relation: relation.value,
      phone: phone.value,
      priority: priority.value,
    });
  }
  return { value: normalized };
}

function parse(value, { partial = false } = {}) {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    return failure({ form: ['Please provide the parent details.'] });
  const fields = {};
  const data = {};
  const checks = {
    name: () => text(value.name, 'a name', { optional: partial }),
    age: () => {
      if (partial && value.age === undefined) return { value: undefined };
      return Number.isInteger(value.age) && value.age >= 40 && value.age <= 120
        ? { value: value.age }
        : { message: 'Enter an age between 40 and 120.' };
    },
    phone: () => {
      if (value.phone === undefined && partial) return { value: undefined };
      return value.phone === undefined || value.phone === null || value.phone === ''
        ? { value: null }
        : typeof value.phone === 'string' && PHONE_PATTERN.test(value.phone)
          ? { value: value.phone }
          : { message: 'Include the parent’s country code.' };
    },
    addressText: () => text(value.addressText, 'an address', { optional: partial }),
    locationShareUrl: () => mapLink(value.locationShareUrl, { optional: partial }),
    careNotes: () =>
      value.careNotes === undefined && partial
        ? { value: undefined }
        : value.careNotes === undefined || value.careNotes === null || value.careNotes === ''
          ? { value: null }
          : text(value.careNotes, 'care notes'),
    emergencyContacts: () =>
      partial && value.emergencyContacts === undefined
        ? { value: undefined }
        : contacts(value.emergencyContacts),
  };
  for (const [key, check] of Object.entries(checks)) {
    const result = check();
    if (result.message) fields[key] = [result.message];
    else if (result.value !== undefined) data[key] = result.value;
  }
  if (partial && Object.keys(data).length === 0 && Object.keys(fields).length === 0)
    fields.form = ['Provide at least one editable field.'];
  return Object.keys(fields).length ? failure(fields) : { success: true, data };
}

export const createParentSchema = { safeParse: (value) => parse(value) };
export const updateParentSchema = { safeParse: (value) => parse(value, { partial: true }) };
