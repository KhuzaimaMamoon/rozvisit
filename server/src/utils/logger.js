import { sensitiveFields } from '../config/sensitiveFields.js';

const REDACTED = '[REDACTED]';
const sensitiveKeys = new Set(sensitiveFields.map((field) => field.split('.').at(-1)));

function redact(value, key) {
  if (sensitiveKeys.has(key) || /secret|token|password|authorization/i.test(key)) {
    return REDACTED;
  }

  if (Array.isArray(value)) {
    return value.map((item) => redact(item, ''));
  }

  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([entryKey, entryValue]) => [
        entryKey,
        redact(entryValue, entryKey),
      ]),
    );
  }

  return value;
}

function write(level, event, context = {}) {
  const record = {
    level,
    event,
    timestamp: new Date().toISOString(),
    ...redact(context, ''),
  };
  process.stdout.write(`${JSON.stringify(record)}\n`);
}

export const logger = Object.freeze({
  debug(event, context) {
    write('debug', event, context);
  },
  info(event, context) {
    write('info', event, context);
  },
  warn(event, context) {
    write('warn', event, context);
  },
  error(event, context) {
    write('error', event, context);
  },
});
