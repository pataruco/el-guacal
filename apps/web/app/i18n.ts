import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import enGB from './locales/en-GB/translation.json';
import esVE from './locales/es-VE/translation.json';

export const defaultNS = 'translation';
export const resources = {
  'en-GB': {
    translation: enGB,
  },
  'es-VE': {
    translation: esVE,
  },
} as const;

export const supportedLngs = ['en-GB', 'es-VE'];

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    lng: typeof window !== 'undefined' ? localStorage.getItem('i18nextLng') || undefined : 'en-GB',
    fallbackLng: 'en-GB',
    supportedLngs,
    interpolation: {
      escapeValue: false, // react already safes from xss
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },
  });

export default i18n;
