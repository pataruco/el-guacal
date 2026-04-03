import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Navigate, Outlet, useParams } from 'react-router';
import { isValidLocale, toI18nLocale } from '@/i18n';

export default function LocaleLayout() {
  const { locale } = useParams<{ locale: string }>();
  const { i18n } = useTranslation();

  const validLocale = locale && isValidLocale(locale);

  useEffect(() => {
    if (validLocale) {
      const i18nLang = toI18nLocale(locale);
      if (i18n.language !== i18nLang) {
        i18n.changeLanguage(i18nLang);
        localStorage.setItem('i18nextLng', i18nLang);
      }
    }
  }, [locale, validLocale, i18n]);

  if (!validLocale) {
    return <Navigate to="/en" replace />;
  }

  return <Outlet />;
}
