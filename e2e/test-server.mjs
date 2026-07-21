import { rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { createServer as createViteServer } from 'vite';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const stateFile = '/tmp/rozvisit-e2e-state.json';
const apiPort = 5010;
const clientPort = 5174;

await rm(stateFile, { force: true });
const mongo = await MongoMemoryServer.create();

Object.assign(process.env, {
  APP_BASE_URL: `http://127.0.0.1:${clientPort}`,
  CLOUDINARY_API_KEY: '123456789012345',
  CLOUDINARY_API_SECRET: 'e2e-fake-cloudinary-secret-not-for-production',
  CLOUDINARY_CLOUD_NAME: 'rozvisit-e2e-fake',
  EMAIL_FROM_ADDRESS: 'e2e-noreply@example.invalid',
  FIELD_ENCRYPTION_KEY: 'MDEyMzQ1Njc4OWFiY2RlZjAxMjM0NTY3ODlhYmNkZWY=',
  FIREBASE_SERVICE_ACCOUNT_JSON:
    '{"client_email":"e2e@example.invalid","private_key":"fake","project_id":"rozvisit-e2e"}',
  JWT_ACCESS_SECRET: 'e2e-fake-access-secret-not-for-production-0001',
  JWT_REFRESH_SECRET: 'e2e-fake-refresh-secret-not-for-production-0002',
  MONGO_URI: mongo.getUri(),
  NODE_ENV: 'test',
  PORT: String(apiPort),
  RESEND_API_KEY: '',
});

const { createApp } = await import('../server/src/app.js');
await mongoose.connect(process.env.MONGO_URI);
const apiServer = createApp().listen(apiPort, '127.0.0.1');
process.chdir(path.join(root, 'client'));
const vite = await createViteServer({
  configFile: path.join(process.cwd(), 'vite.config.js'),
  root: process.cwd(),
  server: {
    host: '127.0.0.1',
    port: clientPort,
    strictPort: true,
    proxy: { '/api': `http://127.0.0.1:${apiPort}` },
  },
});
await vite.listen();
await writeFile(stateFile, JSON.stringify({ mongoUri: mongo.getUri() }));

async function shutdown() {
  await rm(stateFile, { force: true });
  await vite.close();
  await new Promise((resolve) => apiServer.close(resolve));
  await mongoose.disconnect();
  await mongo.stop();
}

process.once('SIGINT', () => shutdown().then(() => process.exit(0)));
process.once('SIGTERM', () => shutdown().then(() => process.exit(0)));
