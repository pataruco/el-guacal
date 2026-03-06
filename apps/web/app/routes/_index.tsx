import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router';
import MapComponent from '../components/map';
import Page from '../components/page';
import StoreComponent from '../components/store';
import { supportedLngs } from '../i18n';

export default function Home() {
  const { lang } = useParams();
  const navigate = useNavigate();
  const { i18n } = useTranslation();

  useEffect(() => {
    if (!lang) {
      const detectedLng = localStorage.getItem('i18nextLng') || i18n.language || 'en-GB';
      const targetLng = supportedLngs.includes(detectedLng) ? detectedLng : 'en-GB';
      navigate(`/${targetLng}`, { replace: true });
    }
  }, [lang, i18n.language, navigate]);

  if (!lang) {
    return null;
  }

  return (
    <Page className="home">
      <MapComponent />
      <StoreComponent />
    </Page>
  );
}
