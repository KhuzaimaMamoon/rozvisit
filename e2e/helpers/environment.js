export function configureE2eEnvironment({ mongoUri } = {}) {
  Object.assign(process.env, {
    APP_BASE_URL: 'http://127.0.0.1:5174',
    CLOUDINARY_API_KEY: '123456789012345',
    CLOUDINARY_API_SECRET: 'e2e-fake-cloudinary-secret-not-for-production',
    CLOUDINARY_CLOUD_NAME: 'rozvisit-e2e-fake',
    EMAIL_FROM_ADDRESS: 'e2e-noreply@example.invalid',
    FIELD_ENCRYPTION_KEY: 'MDEyMzQ1Njc4OWFiY2RlZjAxMjM0NTY3ODlhYmNkZWY=',
    FIREBASE_SERVICE_ACCOUNT_JSON:
      '{"client_email":"e2e@example.invalid","private_key":"fake","project_id":"rozvisit-e2e"}',
    JWT_ACCESS_SECRET: 'e2e-fake-access-secret-not-for-production-0001',
    JWT_REFRESH_SECRET: 'e2e-fake-refresh-secret-not-for-production-0002',
    ...(mongoUri ? { MONGO_URI: mongoUri } : {}),
    NODE_ENV: 'test',
  });
}
