import path from 'node:path';
import { reactRouter } from '@react-router/dev/vite';
import { defineConfig } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';
import { readApiVersion, readWebVersion } from './config/versions';

export default defineConfig({
  plugins: [reactRouter(), tsconfigPaths()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'app'),
    },
  },
  define: {
    __WEB_VERSION__: JSON.stringify(readWebVersion()),
    __API_VERSION__: JSON.stringify(readApiVersion()),
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
