import 'dotenv/config';

const REQUIRED = [
  'NODE_ENV',
  'MONGO_URI',
  'JWT_ACCESS_SECRET',
  'JWT_REFRESH_SECRET',
  'FIELD_ENCRYPTION_KEY',
  'CLOUDINARY_CLOUD_NAME',
  'CLOUDINARY_API_KEY',
  'CLOUDINARY_API_SECRET',
  'FIREBASE_SERVICE_ACCOUNT_JSON',
  'EMAIL_FROM_ADDRESS',
  'APP_BASE_URL',
];

const OPTIONAL = [
  'PORT',
  'LOG_LEVEL',
  'SENTRY_DSN',
  'DEV_LOG_AUTH_LINKS',
  'RESEND_API_KEY',
  'GMAIL_USER',
  'GMAIL_APP_PASSWORD',
];
const VALID_NODE_ENVS = new Set(['development', 'test', 'production']);
const VALID_LOG_LEVELS = new Set(['error', 'warn', 'info', 'debug']);
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function fail(message) {
  process.stderr.write(`FATAL: ${message}\n`);
  process.exit(1);
}

function validateFirebaseServiceAccount(value) {
  try {
    const parsed = JSON.parse(value);
    return ['client_email', 'private_key', 'project_id'].every(
      (key) => typeof parsed[key] === 'string',
    );
  } catch {
    return false;
  }
}

const missing = REQUIRED.filter((key) => !process.env[key]);
if (missing.length > 0) {
  fail(`missing required env vars: ${missing.join(', ')}`);
}

if (!VALID_NODE_ENVS.has(process.env.NODE_ENV)) {
  fail('NODE_ENV must be development, test, or production');
}

if (process.env.JWT_ACCESS_SECRET === process.env.JWT_REFRESH_SECRET) {
  fail('JWT_ACCESS_SECRET and JWT_REFRESH_SECRET must differ');
}

if (process.env.JWT_ACCESS_SECRET.length < 32 || process.env.JWT_REFRESH_SECRET.length < 32) {
  fail('JWT secrets must be at least 32 characters');
}

if (Buffer.from(process.env.FIELD_ENCRYPTION_KEY, 'base64').length !== 32) {
  fail('FIELD_ENCRYPTION_KEY must decode to exactly 32 bytes');
}

if (!/^\d+$/.test(process.env.CLOUDINARY_API_KEY)) {
  fail('CLOUDINARY_API_KEY must be numeric');
}

if (!validateFirebaseServiceAccount(process.env.FIREBASE_SERVICE_ACCOUNT_JSON)) {
  fail('FIREBASE_SERVICE_ACCOUNT_JSON must be valid service account JSON');
}

if (!EMAIL_PATTERN.test(process.env.EMAIL_FROM_ADDRESS)) {
  fail('EMAIL_FROM_ADDRESS must be a valid email address');
}

const hasGmailUser = Boolean(process.env.GMAIL_USER);
const hasGmailAppPassword = Boolean(process.env.GMAIL_APP_PASSWORD);
if (hasGmailUser !== hasGmailAppPassword) {
  fail('GMAIL_USER and GMAIL_APP_PASSWORD must be set together');
}
if (hasGmailUser && !EMAIL_PATTERN.test(process.env.GMAIL_USER)) {
  fail('GMAIL_USER must be a valid email address');
}
const gmailAppPassword = process.env.GMAIL_APP_PASSWORD?.replaceAll(/\s/g, '') ?? null;
if (hasGmailAppPassword && (!gmailAppPassword || gmailAppPassword.length !== 16)) {
  fail('GMAIL_APP_PASSWORD must be a 16-character Gmail app password');
}

try {
  new URL(process.env.APP_BASE_URL);
} catch {
  fail('APP_BASE_URL must be a valid URL');
}

if (
  process.env.DEV_LOG_AUTH_LINKS !== undefined &&
  !['true', 'false'].includes(process.env.DEV_LOG_AUTH_LINKS)
) {
  fail('DEV_LOG_AUTH_LINKS must be true or false when set');
}
const devLogAuthLinks = process.env.DEV_LOG_AUTH_LINKS === 'true';
const appHost = new URL(process.env.APP_BASE_URL).hostname;
const appOrigin = new URL(process.env.APP_BASE_URL).origin;
if (
  devLogAuthLinks &&
  (process.env.NODE_ENV !== 'development' || !['localhost', '127.0.0.1', '::1'].includes(appHost))
) {
  fail('DEV_LOG_AUTH_LINKS may only be enabled in development with a localhost APP_BASE_URL');
}

const port = Number(process.env.PORT ?? 5000);
if (!Number.isInteger(port) || port < 1024 || port > 65535) {
  fail('PORT must be an integer between 1024 and 65535');
}

const logLevel =
  process.env.LOG_LEVEL ?? (process.env.NODE_ENV === 'production' ? 'info' : 'debug');
if (!VALID_LOG_LEVELS.has(logLevel)) {
  fail('LOG_LEVEL must be error, warn, info, or debug');
}

if (process.env.SENTRY_DSN) {
  try {
    new URL(process.env.SENTRY_DSN);
  } catch {
    fail('SENTRY_DSN must be a valid URL when set');
  }
}

void OPTIONAL;

export const env = Object.freeze({
  port,
  nodeEnv: process.env.NODE_ENV,
  mongoUri: process.env.MONGO_URI,
  jwt: Object.freeze({
    accessSecret: process.env.JWT_ACCESS_SECRET,
    refreshSecret: process.env.JWT_REFRESH_SECRET,
  }),
  fieldEncryptionKey: process.env.FIELD_ENCRYPTION_KEY,
  cloudinary: Object.freeze({
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    apiSecret: process.env.CLOUDINARY_API_SECRET,
  }),
  firebase: Object.freeze({ serviceAccountJson: process.env.FIREBASE_SERVICE_ACCOUNT_JSON }),
  email: Object.freeze({
    fromAddress: process.env.EMAIL_FROM_ADDRESS,
    resendApiKey: process.env.RESEND_API_KEY ?? null,
    gmailUser: process.env.GMAIL_USER ?? null,
    gmailAppPassword,
  }),
  appBaseUrl: process.env.APP_BASE_URL,
  appOrigin,
  devLogAuthLinks,
  sentryDsn: process.env.SENTRY_DSN ?? null,
  logLevel,
});
