import { type MetaFunction, useParams } from 'react-router';
import type { Dataset, WithContext } from 'schema-dts';
import JsonLd from '../components/json-ld';
import Page from '../components/page';
import i18n from '../i18n/config';
import { getSeoMeta } from '../utils/seo';

export const meta: MetaFunction = ({ params }) => {
  const locale = params.locale || 'en-GB';
  return getSeoMeta({
    description: i18n.t('seo.dataset.description', { lng: locale }),
    locale,
    path: `/${locale}/dataset`,
    title: i18n.t('seo.dataset.title', { lng: locale }),
  });
};

export default function DatasetPage() {
  const { locale } = useParams<{ locale: string }>();
  const today = new Date().toISOString().split('T')[0];
  const downloadUrl = `https://github.com/pataruco/el-guacal/releases/download/${encodeURI(`data-export@${today}`)}/el-guacal-db-${today}.zip`;

  const jsonLd: WithContext<Dataset> = {
    '@context': 'https://schema.org',
    '@type': 'Dataset',
    description: i18n.t('pages.dataset.description'),
    distribution: [
      {
        '@type': 'DataDownload',
        contentUrl: downloadUrl,
        encodingFormat: 'application/zip',
      },
    ],
    inLanguage: locale,
    name: i18n.t('pages.dataset.title'),
    url: `https://elguacal.com/${locale}/dataset`,
  };

  return (
    <Page className="c-page">
      <JsonLd data={jsonLd} />
      <h1 className="c-page__title">{i18n.t('pages.dataset.title')}</h1>
      <p className="c-page__text">{i18n.t('pages.dataset.description')}</p>

      <section className="c-page__section">
        <a className="c-page__btn" href={downloadUrl} download>
          {i18n.t('pages.dataset.download')} ({today}) — ZIP
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
