import { useParams } from 'react-router';
import Page from '@/components/page';
import type { ContentLocale } from '@/i18n';
import { markdownToHtml, parseFrontmatter } from '@/utils/markdown';

const aboutModules = import.meta.glob<string>('../i18n/content/about/*.md', {
  eager: true,
  import: 'default',
  query: '?raw',
});

function getAboutContent(locale: ContentLocale) {
  const key = `../i18n/content/about/${locale}.md`;
  const raw = aboutModules[key];
  if (!raw) return null;
  const { content, data } = parseFrontmatter(raw);
  return { html: markdownToHtml(content), title: data.title ?? '' };
}

export default function About() {
  const { locale } = useParams<{ locale: string }>();
  const about = getAboutContent((locale as ContentLocale) ?? 'en');

  if (!about) return null;

  // Content is self-authored markdown files bundled at build time
  return (
    <Page className="c-page">
      <h1 className="c-page__title">{about.title}</h1>
      <div
        className="c-blog__content"
        dangerouslySetInnerHTML={{ __html: about.html }}
      />
    </Page>
  );
}
