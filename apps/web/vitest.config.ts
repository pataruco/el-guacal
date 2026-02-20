import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  // @ts-expect-error
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
  },
});
