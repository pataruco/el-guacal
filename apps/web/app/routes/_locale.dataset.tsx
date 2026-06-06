import { type MetaFunction, useParams } from 'react-router';
import type { Dataset, WithContext } from 'schema-dts';
import JsonLd from '../components/json-ld';
import Page from '../components/page';
import i18n from '../i18n/config';
import { resolveMetaLocale } from '../i18n/locale';
import { getSeoMeta } from '../utils/seo';

export const meta: MetaFunction = ({ params }) => {
  const { contentLocale, i18nLng } = resolveMetaLocale(params.locale);
  return getSeoMeta({
    description: i18n.t('seo.dataset.description', { lng: i18nLng }),
    imageAlt: i18n.t('seo.imageAlt', { lng: i18nLng }),
    locale: i18nLng,
    path: `/${contentLocale}/dataset`,
    title: i18n.t('seo.dataset.title', { lng: i18nLng }),
  });
};

export default function DatasetPage() {
  const { locale } = useParams<{ locale: string }>();
  const { contentLocale, i18nLng } = resolveMetaLocale(locale);
  const today = new Date().toISOString().split('T')[0];
  const downloadUrl = `https://github.com/pataruco/el-guacal/releases/download/${encodeURI(`data-export@${today}`)}/el-guacal-db-${today}.zip`;

  const jsonLd: WithContext<Dataset> = {
    '@context': 'https://schema.org',
    '@type': 'Dataset',
    description: i18n.t('pages.dataset.description', { lng: i18nLng }),
    distribution: [
      {
        '@type': 'DataDownload',
        contentUrl: downloadUrl,
        encodingFormat: 'application/zip',
      },
    ],
    inLanguage: i18nLng,
    name: i18n.t('pages.dataset.title', { lng: i18nLng }),
    url: `https://elguacal.com/${contentLocale}/dataset`,
  };

  return (
    <Page className="c-page c-page--prose">
      <JsonLd data={jsonLd} />
      <h1 className="c-page__title">{i18n.t('pages.dataset.title')}</h1>
      <p className="c-page__text">{i18n.t('pages.dataset.description')}</p>

      <section className="c-page__section">
        <a className="c-page__btn" href={downloadUrl} download>
          {i18n.t('pages.dataset.download')} ({today}) — ZIP
          <svg
            className="c-page__btn-icon"
            viewBox="0 0 20 20"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            focusable="false"
          >
            <path d="M10 3v10" />
            <path d="m5 9 5 5 5-5" />
            <path d="M3.5 17h13" />
          </svg>
        </a>
      </section>

      <section className="c-page__section">
        <h2>{i18n.t('pages.dataset.whatsIncluded')}</h2>
        <ul className="c-page__list">
          <li className="c-page__list-item">
            <strong>stores.csv</strong>: {i18n.t('pages.dataset.storesCsv')}
          </li>
          <li className="c-page__list-item">
            <strong>products.csv</strong>: {i18n.t('pages.dataset.productsCsv')}
          </li>
          <li className="c-page__list-item">
            <strong>data.json</strong>: {i18n.t('pages.dataset.dataJson')}
          </li>
        </ul>
      </section>
    </Page>
  );
}
