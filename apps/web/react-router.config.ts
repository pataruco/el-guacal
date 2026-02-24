import type { Config } from '@react-router/dev/config';

export default {
  async prerender() {
    return ['/', '/about', '/auth/login', '/auth/signup'];
  },
  ssr: true,
} satisfies Config;
