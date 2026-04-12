import { type MetaFunction, useParams } from 'react-router';
import type { AboutPage, WithContext } from 'schema-dts';
import JsonLd from '@/components/json-ld';
import Page from '@/components/page';
import type { ContentLocale } from '@/i18n';
import i18n from '@/i18n/config';
import { markdownToHtml, parseFrontmatter } from '@/utils/markdown';
import { getSeoMeta } from '@/utils/seo';

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

export const meta: MetaFunction = ({ params }) => {
  const locale = params.locale || 'en-GB';
  return getSeoMeta({
    description: i18n.t('seo.about.description', { lng: locale }),
    locale,
    path: `/${locale}/about`,
    title: i18n.t('seo.about.title', { lng: locale }),
  });
};

export default function About() {
  const { locale } = useParams<{ locale: string }>();
  const about = getAboutContent((locale as ContentLocale) ?? 'en');

  if (!about) return null;

  const jsonLd: WithContext<AboutPage> = {
    '@context': 'https://schema.org',
    '@type': 'AboutPage',
    description: i18n.t('seo.about.description'),
    inLanguage: locale,
    mainEntity: {
      '@type': 'Organization',
      name: 'El Guacal',
      url: 'https://elguacal.com',
    },
    name: about.title,
    url: `https://elguacal.com/${locale}/about`,
  };

  return (
    <Page className="c-page">
      <JsonLd data={jsonLd} />
      <h1 className="c-page__title">{about.title}</h1>
      <div
        className="c-blog__content"
        dangerouslySetInnerHTML={{ __html: about.html }}
      />
    </Page>
  );
}
