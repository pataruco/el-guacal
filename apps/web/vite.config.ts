import { reactRouter } from "@react-router/dev/vite";
import path from 'node:path';
import { defineConfig } from 'vite';
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
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
