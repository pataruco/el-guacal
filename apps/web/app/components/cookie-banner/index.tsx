import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useParams } from 'react-router';
import { useLocalStorage } from '@/hooks/use-local-storage';
import type { ContentLocale } from '@/i18n';
import {
  LOCAL_STORAGE_KEY_TRACKING_KEY,
  TRACKING_CONSENT,
  updateConsent,
} from '@/utils/analytics';
import styles from './index.module.scss';

const CookieBanner = () => {
  const [isHydrated, setIsHydrated] = useState(false);
  const [consent, setConsent] = useLocalStorage(LOCAL_STORAGE_KEY_TRACKING_KEY);
  const { locale } = useParams<{ locale: string }>();
  const { t } = useTranslation();
  const currentLocale = (locale as ContentLocale) || 'en';

  const handleConsent = (value: TRACKING_CONSENT) => {
    // The effect below applies the choice to Consent Mode when `consent` changes.
    setConsent(value);
  };

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  // Re-apply the stored consent choice on every page load. Consent Mode resets
  // to the bootstrap default (denied) on each load, so without this a returning
  // visitor who already accepted would keep being tracked as denied.
  useEffect(() => {
    if (
      consent === TRACKING_CONSENT.GRANTED ||
      consent === TRACKING_CONSENT.DENIED
    ) {
      updateConsent(consent);
    }
  }, [consent]);

  if (
    consent === TRACKING_CONSENT.GRANTED ||
    consent === TRACKING_CONSENT.DENIED ||
    !isHydrated
  ) {
    return null;
  }

  return (
    <section
      className={styles['c-cookie-banner']}
      aria-label={t('cookieBanner.ariaLabel')}
    >
      <div className={styles['c-cookie-banner__container']}>
        <h2 className={styles['c-cookie-banner__title']}>
          {t('cookieBanner.title')}
        </h2>
        <p className={styles['c-cookie-banner__body']}>
          {t('cookieBanner.body')}{' '}
          <Link
            to={`/${currentLocale}/privacy-policy`}
            className={styles['c-cookie-banner__link']}
          >
            {t('cookieBanner.privacyLink')}
          </Link>
          .
        </p>

        <menu className={styles['c-cookie-banner__actions']}>
          <li>
            <button
              type="button"
              className={`${styles['c-cookie-banner__btn']} ${styles['c-cookie-banner__btn--reject']}`}
              onClick={() => handleConsent(TRACKING_CONSENT.DENIED)}
            >
              {t('cookieBanner.reject')}
            </button>
          </li>
          <li>
            <button
              type="button"
              className={`${styles['c-cookie-banner__btn']} ${styles['c-cookie-banner__btn--accept']}`}
              onClick={() => handleConsent(TRACKING_CONSENT.GRANTED)}
            >
              {t('cookieBanner.accept')}
            </button>
          </li>
        </menu>
      </div>
    </section>
  );
};

export default CookieBanner;
