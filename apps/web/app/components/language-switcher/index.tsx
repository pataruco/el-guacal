import { useId } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation, useParams } from 'react-router';
import { type ContentLocale, SUPPORTED_LOCALES } from '@/i18n';
import styles from './index.module.scss';

const languageLabels: Record<ContentLocale, string> = {
  en: 'English',
  es: 'Español',
};

type LanguageSwitcherProps = {
  // `menu` = vertical list with a visible label (mobile slide-out menu).
  // `inline` = horizontal toggle with an accessible label (desktop header).
  variant: 'menu' | 'inline';
  // Called after a locale link is activated, e.g. to close the menu.
  onNavigate?: () => void;
};

const LanguageSwitcher = ({ variant, onNavigate }: LanguageSwitcherProps) => {
  const { t } = useTranslation();
  const { locale } = useParams<{ locale: string }>();
  const location = useLocation();
  const labelId = useId();
  const currentLocale = (locale as ContentLocale) || 'en';

  const items = SUPPORTED_LOCALES.map((loc) => {
    const isCurrent = loc === currentLocale;
    const itemClass = `${styles['c-language-switcher__option']} ${
      isCurrent ? styles['c-language-switcher__option--current'] : ''
    }`;

    return (
      <li key={loc} className={styles['c-language-switcher__item']}>
        {isCurrent ? (
          // Current locale: a marker, not a link — activating it would do
          // nothing. aria-current carries the state; `lang` lets a screen
          // reader pronounce the endonym correctly.
          <span lang={loc} aria-current="true" className={itemClass}>
            {languageLabels[loc]}
          </span>
        ) : (
          <Link
            to={location.pathname.replace(/^\/(en|es)/, `/${loc}`)}
            lang={loc}
            hrefLang={loc}
            onClick={onNavigate}
            className={itemClass}
          >
            {languageLabels[loc]}
          </Link>
        )}
      </li>
    );
  });

  if (variant === 'menu') {
    return (
      <div className={styles['c-language-switcher']}>
        <p id={labelId} className={styles['c-language-switcher__label']}>
          {t('nav.languageSelector')}
        </p>
        <ul
          aria-labelledby={labelId}
          className={styles['c-language-switcher__list']}
        >
          {items}
        </ul>
      </div>
    );
  }

  return (
    <ul
      aria-label={t('nav.languageSelector')}
      className={`${styles['c-language-switcher__list']} ${styles['c-language-switcher__list--inline']}`}
    >
      {items}
    </ul>
  );
};

export default LanguageSwitcher;
