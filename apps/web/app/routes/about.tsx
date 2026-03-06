import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router';
import Page from '../components/page';
import { supportedLngs } from '../i18n';

export default function About() {
  const { lang } = useParams();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  useEffect(() => {
    if (!lang) {
      const detectedLng = localStorage.getItem('i18nextLng') || i18n.language || 'en-GB';
      const targetLng = supportedLngs.includes(detectedLng) ? detectedLng : 'en-GB';
      navigate(`/${targetLng}/about`, { replace: true });
    }
  }, [lang, i18n.language, navigate]);

  if (!lang) {
    return null;
  }

  return (
    <Page className="about">
      <h1>{t('pages.about.title')}</h1>
      <p>{t('pages.about.body')}</p>
    </Page>
  );
}
