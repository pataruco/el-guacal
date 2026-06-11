import path from 'node:path';
import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';
import { readApiVersion, readWebVersion } from './versions';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  // @ts-expect-error
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '..', 'app'),
    },
  },
  define: {
    __WEB_VERSION__: JSON.stringify(readWebVersion()),
    __API_VERSION__: JSON.stringify(readApiVersion()),
  },
  test: {
    environment: 'jsdom',
    globals: true,
  },
});
