import i18n from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { initReactI18next } from 'react-i18next';

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
    detection: {
      caches: ['localStorage'],
      order: ['localStorage', 'navigator'],
    },
    fallbackLng: 'en-GB',
    interpolation: {
      escapeValue: false, // react already safes from xss
    },
    lng:
      typeof window !== 'undefined'
        ? localStorage.getItem('i18nextLng') || undefined
        : 'en-GB',
    resources,
    supportedLngs,
  });

export default i18n;
