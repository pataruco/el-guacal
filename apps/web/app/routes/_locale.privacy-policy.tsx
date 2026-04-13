import { useParams } from 'react-router';
import Page from '@/components/page';
import type { ContentLocale } from '@/i18n';
import { markdownToHtml, parseFrontmatter } from '@/utils/markdown';

const privacyPolicyModules = import.meta.glob<string>(
  '../i18n/content/privacy-policy/*.md',
  {
    eager: true,
    import: 'default',
    query: '?raw',
  },
);

function getContent(locale: ContentLocale) {
  const key = `../i18n/content/privacy-policy/${locale}.md`;
  const raw = privacyPolicyModules[key];
  if (!raw) return null;
  const { content, data } = parseFrontmatter(raw);
  return { html: markdownToHtml(content), title: data.title ?? '' };
}

export default function PrivacyPolicy() {
  const { locale } = useParams<{ locale: string }>();
  const privacyPolicy = getContent((locale as ContentLocale) ?? 'en');

  if (!privacyPolicy) return null;

  // Content is self-authored markdown files bundled at build time
  return (
    <Page className="c-page">
      <h1 className="c-page__title">{privacyPolicy.title}</h1>
      <div
        className="c-blog__content"
        // biome-ignore lint/security/noDangerouslySetInnerHtml: is parsing markdown
        dangerouslySetInnerHTML={{ __html: privacyPolicy.html }}
      />
    </Page>
  );
}
