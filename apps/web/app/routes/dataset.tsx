import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router';
import Page from '../components/page';
import { supportedLngs } from '../i18n';

export default function Dataset() {
  const { lang } = useParams();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  useEffect(() => {
    if (!lang) {
      const detectedLng = localStorage.getItem('i18nextLng') || i18n.language || 'en-GB';
      const targetLng = supportedLngs.includes(detectedLng) ? detectedLng : 'en-GB';
      navigate(`/${targetLng}/dataset`, { replace: true });
    }
  }, [lang, i18n.language, navigate]);

  if (!lang) {
    return null;
  }

  const today = new Date().toISOString().split('T')[0];
  const downloadUrl = `https://github.com/pataruco/el-guacal/releases/download/${encodeURI(`data-export@${today}`)}/el-guacal-db-${today}.zip`;
  console.log(downloadUrl);

  return (
    <Page className="dataset">
      <h1>{t('pages.dataset.title')}</h1>
      <p>{t('pages.dataset.description')}</p>
      <div style={{ marginTop: '2rem' }}>
        <a className="button" href={downloadUrl}>
          {t('pages.dataset.download')} ({today})
        </a>
      </div>
      <section style={{ marginTop: '3rem' }}>
        <h2>{t('pages.dataset.whatsIncluded')}</h2>
        <ul>
          <li>
            <strong>stores.csv</strong>: {t('pages.dataset.storesCsv')}
          </li>
          <li>
            <strong>products.csv</strong>: {t('pages.dataset.productsCsv')}
          </li>
          <li>
            <strong>data.json</strong>: {t('pages.dataset.dataJson')}
          </li>
        </ul>
      </section>
    </Page>
  );
}
