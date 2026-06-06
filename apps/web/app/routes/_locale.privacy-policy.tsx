import { type MetaFunction, useParams } from 'react-router';
import type { WebPage, WithContext } from 'schema-dts';
import JsonLd from '@/components/json-ld';
import Page from '@/components/page';
import type { ContentLocale } from '@/i18n';
import i18n from '@/i18n/config';
import { resolveMetaLocale } from '@/i18n/locale';
import { markdownToHtml, parseFrontmatter } from '@/utils/markdown';
import { getSeoMeta } from '@/utils/seo';

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

export const meta: MetaFunction = ({ params }) => {
  const { contentLocale, i18nLng } = resolveMetaLocale(params.locale);
  const content = getContent(contentLocale);
  const title = content?.title ?? 'Privacy policy';
  return getSeoMeta({
    description: i18n.t('seo.privacyPolicy.description', { lng: i18nLng }),
    imageAlt: i18n.t('seo.imageAlt', { lng: i18nLng }),
    locale: i18nLng,
    path: `/${contentLocale}/privacy-policy`,
    title: `${title} — El Guacal`,
  });
};

export default function PrivacyPolicy() {
  const { locale } = useParams<{ locale: string }>();
  const { contentLocale, i18nLng } = resolveMetaLocale(locale);
  const privacyPolicy = getContent(contentLocale);

  if (!privacyPolicy) return null;

  const jsonLd: WithContext<WebPage> = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    description: i18n.t('seo.privacyPolicy.description', { lng: i18nLng }),
    inLanguage: i18nLng,
    name: privacyPolicy.title,
    url: `https://elguacal.com/${contentLocale}/privacy-policy`,
  };

  return (
    <Page className="c-page c-page--prose">
      <JsonLd data={jsonLd} />
      <h1 className="c-page__title">{privacyPolicy.title}</h1>
      <div
        className="c-blog__content"
        // biome-ignore lint/security/noDangerouslySetInnerHtml: is parsing markdown
        dangerouslySetInnerHTML={{ __html: privacyPolicy.html }}
      />
    </Page>
  );
}
