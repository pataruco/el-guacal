import { useTranslation } from 'react-i18next';
import { Link, type MetaFunction, useParams } from 'react-router';
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
    <Page className="c-page">
      <JsonLd data={jsonLd} />
      <h1 className="c-page__title">{about.title}</h1>
      <div
        className="c-blog__content"
        dangerouslySetInnerHTML={{ __html: about.html }}
      />

      {/* "Contribute to our dataset" CTA card (Figma section
          77:11488). Bottom of the about page, prompts readers to
          register and add locations. Hero panel is a gradient
          placeholder until a real photo asset arrives. */}
      <aside className="c-page__cta">
        <div className="c-page__cta-body">
          <h2>{t('about.ctaTitle')}</h2>
          <p>{t('about.ctaBody')}</p>
          <Link
            to={`/${currentLocale}/stores/new`}
            className="c-page__btn"
          >
            {t('nav.addLocation')}
          </Link>
        </div>
        <div className="c-page__cta-hero" aria-hidden="true" />
      </aside>
    </Page>
  );
}
