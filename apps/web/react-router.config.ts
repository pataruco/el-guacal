import type { Config } from '@react-router/dev/config';

export default {
  async prerender() {
    return ['/', '/about', '/en-GB', '/en-GB/about', '/es-VE', '/es-VE/about'];
  },
  ssr: false,
} satisfies Config;
