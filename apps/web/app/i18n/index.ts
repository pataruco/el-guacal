export {
  default as i18n,
  ENGLISH,
  type Language,
  SPANISH,
  supportedLngs,
} from './config';
export { formatDate } from './date';
export {
  type ContentLocale,
  detectLocale,
  getOtherLocale,
  isValidLocale,
  SUPPORTED_LOCALES,
  toContentLocale,
  toI18nLocale,
} from './locale';
