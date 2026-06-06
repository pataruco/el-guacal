import { useTranslation } from 'react-i18next';
import { Link, type MetaFunction, useParams } from 'react-router';
import type { AboutPage, WithContext } from 'schema-dts';
import JsonLd from '@/components/json-ld';
import Page from '@/components/page';
import type { ContentLocale } from '@/i18n';
import i18n from '@/i18n/config';
import { resolveMetaLocale } from '@/i18n/locale';
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
  const { contentLocale, i18nLng } = resolveMetaLocale(params.locale);
  return getSeoMeta({
    description: i18n.t('seo.about.description', { lng: i18nLng }),
    locale: i18nLng,
    path: `/${contentLocale}/about`,
    title: i18n.t('seo.about.title', { lng: i18nLng }),
  });
};

export default function About() {
  const { locale } = useParams<{ locale: string }>();
  const { t } = useTranslation();
  const about = getAboutContent((locale as ContentLocale) ?? 'en');
  const currentLocale = locale || 'en';

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
    <Page className="c-page c-page--prose">
      <JsonLd data={jsonLd} />
      <h1 className="c-page__title">{about.title}</h1>
      <div
        className="c-blog__content"
        dangerouslySetInnerHTML={{ __html: about.html }}
      />

      {/* "Contribute to our dataset" CTA card (Figma section
          77:11488). Bottom of the about page, prompts readers to
          register and add locations. Hero panel uses the brand
          logo on a solid blue surface — same pattern as the auth
          page hero. */}
      <aside className="c-page__cta">
        <div className="c-page__cta-body">
          <h2>{t('about.ctaTitle')}</h2>
          <p>{t('about.ctaBody')}</p>
          <Link to={`/${currentLocale}/stores/new`} className="c-page__btn">
            {t('nav.addLocation')}
          </Link>
        </div>
        <div className="c-page__cta-hero" aria-hidden="true">
          <svg
            className="c-page__cta-hero-icon"
            viewBox="0 0 82 77"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <title>{t('about.ctaTitle')}</title>
            <path
              d="M38.5165 10.0101L16.8085 20.1923L7.25441 15.6471L38.5165 0.61869C40.2369 -0.206229 42.3489 -0.206229 44.0693 0.61869L74.2545 16.0509L64.2227 21L44.0693 10.0101C42.3489 9.18516 40.2369 9.18516 38.5165 10.0101Z"
              fill="currentColor"
            />
            <path
              d="M38.0942 36.4292L0 18V27.9175L38.0942 46.3467C39.8948 47.2178 42.1054 47.2178 43.9061 46.3467L82 27.9175V18L43.9061 36.4292C42.1054 37.3003 39.8948 37.3003 38.0942 36.4292Z"
              fill="currentColor"
            />
            <path
              d="M38.0942 51.4292L0 33V42.9175L38.0942 61.3467C39.8948 62.2178 42.1054 62.2178 43.9061 61.3467L82 42.9175V33L43.9061 51.4292C42.1054 52.3003 39.8948 52.3003 38.0942 51.4292Z"
              fill="currentColor"
            />
            <path
              d="M38.0942 66.4292L0 48V57.9175L38.0942 76.3467C39.8948 77.2178 42.1054 77.2178 43.9061 76.3467L82 57.9175V48L43.9061 66.4292C42.1054 67.3003 39.8948 67.3003 38.0942 66.4292Z"
              fill="currentColor"
            />
          </svg>
        </div>
      </aside>
    </Page>
  );
}
