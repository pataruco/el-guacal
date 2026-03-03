import type { Config } from '@react-router/dev/config';

export default {
  async prerender() {
    return ['/', '/about'];
  },
  ssr: false,
} satisfies Config;
