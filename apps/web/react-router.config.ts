import type { Config } from "@react-router/dev/config";

export default {
  ssr: true,
  async prerender() {
    return ["/", "/about", "/auth/login", "/auth/signup"];
  },
} satisfies Config;
