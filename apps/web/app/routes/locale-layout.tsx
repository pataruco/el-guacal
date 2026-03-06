import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Outlet, useNavigate, useParams } from 'react-router';
import { supportedLngs } from '../i18n';

export default function LocaleLayout() {
  const { lang } = useParams();
  const { i18n } = useTranslation();
  const navigate = useNavigate();

  useEffect(() => {
    if (lang && supportedLngs.includes(lang)) {
      if (i18n.language !== lang) {
        i18n.changeLanguage(lang);
        localStorage.setItem('i18nextLng', lang);
      }
    } else if (lang) {
      // If language is not supported, fallback to default (en-GB)
      const newPath = window.location.pathname.replace(/^\/[^/]+/, '/en-GB');
      navigate(newPath, { replace: true });
    }
  }, [lang, i18n, navigate]);

  return <Outlet />;
}
