import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { readFileSync } from 'node:fs';

function localServerPort() {
  if (process.env.PORT) return process.env.PORT;
  try {
    const serverEnvironment = readFileSync(new URL('../server/.env', import.meta.url), 'utf8');
    return serverEnvironment.match(/^PORT=(\d+)$/m)?.[1] ?? '5000';
  } catch {
    return '5000';
  }
}

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': `http://localhost:${localServerPort()}`,
    },
  },
});
