import fs from 'node:fs';
import path from 'node:path';
import type { Config } from '@react-router/dev/config';

export default {
  async prerender() {
    const blogDir = path.resolve(__dirname, 'app/i18n/content/blog/en');
    const slugs = fs.existsSync(blogDir)
      ? fs
          .readdirSync(blogDir)
          .filter((f) => f.endsWith('.md'))
          .map((f) => f.replace('.md', ''))
      : [];

    const locales = ['en', 'es'];
    const pages = ['', '/about', '/dataset', '/blog'];
    const blogPages = slugs.map((s) => `/blog/${s}`);

    return [
      '/',
      ...locales.flatMap((l) => [
        ...pages.map((p) => `/${l}${p}`),
        ...blogPages.map((p) => `/${l}${p}`),
      ]),
    ];
  },
  ssr: false,
} satisfies Config;
