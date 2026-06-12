import path from 'node:path';
import { reactRouter } from '@react-router/dev/vite';
import { defineConfig } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';
import { readApiVersion, readWebVersion } from './config/versions';

export default defineConfig({
  define: {
    __API_VERSION__: JSON.stringify(readApiVersion()),
    __WEB_VERSION__: JSON.stringify(readWebVersion()),
  },
  plugins: [reactRouter(), tsconfigPaths()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'app'),
    },
  },
  server: {
    proxy: {
      '/graphql': {
        changeOrigin: true,
        target: 'http://localhost:8080',
      },
    },
  },
});
