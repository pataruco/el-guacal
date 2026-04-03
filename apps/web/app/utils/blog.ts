import type { ContentLocale } from '@/i18n';
import { markdownToHtml, parseFrontmatter } from './markdown';

export interface BlogPostMeta {
  date: string;
  excerpt: string;
  slug: string;
  title: string;
}

export interface BlogPost extends BlogPostMeta {
  html: string;
}

const markdownModules = import.meta.glob<string>(
  '../i18n/content/blog/**/*.md',
  {
    eager: true,
    import: 'default',
    query: '?raw',
  },
);

function parseSlugAndLang(path: string): { lang: string; slug: string } | null {
  const match = path.match(/\.\.\/i18n\/content\/blog\/([^/]+)\/([^/]+)\.md$/);
  if (!match) return null;
  return { lang: match[1], slug: match[2] };
}

export function getBlogPostList(locale: ContentLocale): BlogPostMeta[] {
  const posts: BlogPostMeta[] = [];
  for (const [path, raw] of Object.entries(markdownModules)) {
    const parsed = parseSlugAndLang(path);
    if (!parsed || parsed.lang !== locale) continue;
    const { data } = parseFrontmatter(raw);
    posts.push({
      date: data.date ?? '',
      excerpt: data.excerpt ?? '',
      slug: parsed.slug,
      title: data.title ?? '',
    });
  }
  return posts.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );
}

export function getBlogPost(
  slug: string,
  locale: ContentLocale,
): BlogPost | null {
  const key = `../i18n/content/blog/${locale}/${slug}.md`;
  const raw = markdownModules[key];
  if (!raw) return null;
  const { content, data } = parseFrontmatter(raw);
  const html = markdownToHtml(content);
  return {
    date: data.date ?? '',
    excerpt: data.excerpt ?? '',
    html,
    slug,
    title: data.title ?? '',
  };
}

export function getAllBlogSlugs(): string[] {
  const slugs = new Set<string>();
  for (const path of Object.keys(markdownModules)) {
    const parsed = parseSlugAndLang(path);
    if (parsed) slugs.add(parsed.slug);
  }
  return Array.from(slugs);
}
