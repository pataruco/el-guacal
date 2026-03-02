import path from 'node:path';
import { reactRouter } from '@react-router/dev/vite';
import type { PluginOption } from 'vite';
import { defineConfig } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';

/**
 * Vite plugin that silently returns 404 for missing static-asset requests
 * (e.g. /favicon.ico, /installHook.js.map) *after* Vite's built-in static
 * file serving but *before* the React Router SSR handler, so they never
 * reach the router and produce noisy console errors.
 */
function staticAsset404Plugin(): PluginOption {
  const staticExtensions = [
    '.ico',
    '.png',
    '.jpg',
    '.jpeg',
    '.gif',
    '.svg',
    '.webp',
    '.css.map',
    '.js.map',
    '.txt',
    '.webmanifest',
  ];

  return {
    configureServer(server) {
      // Returning a function registers it as a "post" middleware that runs
      // after Vite's internal middlewares (which serve public/ files).
      // Because this plugin is listed before reactRouter() in the plugins
      // array, it runs before the React Router SSR handler.
      return () => {
        server.middlewares.use((req, res, next) => {
          const url = req.url ?? '';
          if (staticExtensions.some((ext) => url.endsWith(ext))) {
            res.statusCode = 404;
            res.end();
            return;
          }
          next();
        });
      };
    },
    name: 'static-asset-404',
  };
}

export default defineConfig({
  plugins: [staticAsset404Plugin(), reactRouter(), tsconfigPaths()],
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
