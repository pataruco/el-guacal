import { SUPPORTED_LOCALES } from '@/i18n';
import { getBlogPostList } from '@/utils/blog';

const BASE_URL = 'https://elguacal.com';

export async function loader() {
  const pages = ['', '/about', '/blog', '/dataset'];
  const locales = SUPPORTED_LOCALES;

  let xml = '<?xml version="1.0" encoding="UTF-8"?>';
  xml +=
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">';

  // Root
  xml += `
    <url>
      <loc>${BASE_URL}/</loc>
      <changefreq>daily</changefreq>
      <priority>1.0</priority>
    </url>`;

  for (const locale of locales) {
    // Static pages
    for (const page of pages) {
      const path = `/${locale}${page}`;
      const url = `${BASE_URL}${path}`;
      xml += `
    <url>
      <loc>${url}</loc>
      <changefreq>weekly</changefreq>
      <priority>${page === '' ? '0.9' : '0.7'}</priority>
      ${locales
        .map(
          (l) =>
            `<xhtml:link rel="alternate" hreflang="${l}" href="${BASE_URL}/${l}${page}" />`,
        )
        .join('')}
    </url>`;
    }

    // Blog posts
    const posts = getBlogPostList(locale);
    for (const post of posts) {
      const path = `/${locale}/blog/${post.slug}`;
      const url = `${BASE_URL}${path}`;
      xml += `
    <url>
      <loc>${url}</loc>
      <lastmod>${post.date}</lastmod>
      <changefreq>monthly</changefreq>
      <priority>0.6</priority>
      ${locales
        .map(
          (l) =>
            `<xhtml:link rel="alternate" hreflang="${l}" href="${BASE_URL}/${l}/blog/${post.slug}" />`,
        )
        .join('')}
    </url>`;
    }
  }

  xml += '</urlset>';

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'x-content-type-options': 'nosniff',
    },
  });
}
