import type { Language } from './config';

interface FormatDate {
  date: Date;
  lang?: Language;
}

export const formatDate = ({ date, lang }: FormatDate): string => {
  const options: Intl.DateTimeFormatOptions = {
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    month: 'long',
    year: 'numeric',
  };
  return new Intl.DateTimeFormat(lang, options).format(date);
};
