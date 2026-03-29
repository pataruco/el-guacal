import { useTranslation } from 'react-i18next';
import Page from '../components/page';

export default function Dataset() {
  const { t } = useTranslation();

  const today = new Date().toISOString().split('T')[0];
  const downloadUrl = `https://github.com/pataruco/el-guacal/releases/download/${encodeURI(`data-export@${today}`)}/el-guacal-db-${today}.zip`;

  return (
    <Page className="c-page">
      <h1 className="c-page__title">{t('pages.dataset.title')}</h1>
      <p className="c-page__text">{t('pages.dataset.description')}</p>

      <section className="c-page__section">
        <a className="c-page__btn" href={downloadUrl}>
          {t('pages.dataset.download')} ({today})
        </a>
      </section>

      <section className="c-page__section">
        <h2>{t('pages.dataset.whatsIncluded')}</h2>
        <ul className="c-page__list">
          <li className="c-page__list-item">
            <strong>stores.csv</strong>: {t('pages.dataset.storesCsv')}
          </li>
          <li className="c-page__list-item">
            <strong>products.csv</strong>: {t('pages.dataset.productsCsv')}
          </li>
          <li className="c-page__list-item">
            <strong>data.json</strong>: {t('pages.dataset.dataJson')}
          </li>
        </ul>
      </section>
    </Page>
  );
}
