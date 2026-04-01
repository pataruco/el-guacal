import i18n from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { initReactI18next } from 'react-i18next';

import enGB from './en-GB/translation.json';
import esVE from './es-VE/translation.json';

export const Language = {
  ENGLISH: 'en-GB',
  SPANISH: 'es-VE',
} as const;
export type Language = (typeof Language)[keyof typeof Language];

export const { ENGLISH, SPANISH } = Language;
export const supportedLngs = [ENGLISH, SPANISH];

export const defaultNS = 'translation';
export const resources = {
  [ENGLISH]: {
    translation: enGB,
  },
  [SPANISH]: {
    translation: esVE,
  },
} as const;

const detector = new LanguageDetector();
detector.addDetector({
  lookup() {
    const lng = window.navigator.language;
    if (lng.startsWith('es')) return SPANISH;
    if (lng.startsWith('en')) return ENGLISH;
    return undefined;
  },
  name: 'customNavigator',
});

i18n
  .use(detector)
  .use(initReactI18next)
  .init({
    detection: {
      caches: ['localStorage'],
      order: ['localStorage', 'customNavigator', 'navigator'],
    },
    fallbackLng: ENGLISH,
    interpolation: {
      escapeValue: false,
    },
    resources,
    supportedLngs,
  });

export default i18n;
