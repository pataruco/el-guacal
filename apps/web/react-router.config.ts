import type { Config } from '@react-router/dev/config';

export default {
  async prerender() {
    return ['/', '/about', '/auth'];
  },
  ssr: true,
} satisfies Config;
