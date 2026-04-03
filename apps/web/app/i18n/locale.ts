import { ENGLISH, type Language, SPANISH } from './config';

export const SUPPORTED_LOCALES = ['en', 'es'] as const;
export type ContentLocale = (typeof SUPPORTED_LOCALES)[number];

const I18N_TO_CONTENT: Record<Language, ContentLocale> = {
  [ENGLISH]: 'en',
  [SPANISH]: 'es',
};

const CONTENT_TO_I18N: Record<ContentLocale, Language> = {
  en: ENGLISH,
  es: SPANISH,
};

export function isValidLocale(locale: string): locale is ContentLocale {
  return SUPPORTED_LOCALES.includes(locale as ContentLocale);
}

export function toContentLocale(i18nLang: string): ContentLocale {
  return I18N_TO_CONTENT[i18nLang as Language] ?? 'en';
}

export function toI18nLocale(contentLocale: ContentLocale): Language {
  return CONTENT_TO_I18N[contentLocale];
}

export function detectLocale(): ContentLocale {
  if (typeof window === 'undefined') return 'en';

  const stored = localStorage.getItem('i18nextLng');
  if (stored) {
    return toContentLocale(stored);
  }

  const browserLang = navigator.language;
  if (browserLang.startsWith('es')) return 'es';
  return 'en';
}

export function getOtherLocale(current: ContentLocale): ContentLocale {
  return current === 'en' ? 'es' : 'en';
}
