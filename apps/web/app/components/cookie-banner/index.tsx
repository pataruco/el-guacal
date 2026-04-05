import { useEffect, useState } from 'react';
import { useLocalStorage } from '@/hooks/use-local-storage';
import {
  LOCAL_STORAGE_KEY_TRACKING_KEY,
  TRACKING_CONSENT,
  updateConsent,
} from '@/utils/analytics';
import styles from './index.module.scss';

const CookieBanner = () => {
  const [isHydrated, setIsHydrated] = useState(false);
  const [consent, setConsent] = useLocalStorage(LOCAL_STORAGE_KEY_TRACKING_KEY);

  const handleConsent = (value: TRACKING_CONSENT) => {
    setConsent(value);
    updateConsent(value);
  };

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  if (
    consent === TRACKING_CONSENT.GRANTED ||
    consent === TRACKING_CONSENT.DENIED ||
    !isHydrated
  ) {
    return null;
  }

  return (
    <section className={styles['c-cookie-banner']} aria-label="Cookie consent">
      <div className={styles['c-cookie-banner__container']}>
        <div className={styles['c-cookie-banner__content']}>
          <h2 className={styles['c-cookie-banner__title']}>
            Cookies on El Guacal
          </h2>
          <p className={styles['c-cookie-banner__body']}>
            We use essential cookies to improve your browsing experience on our
            website, analyse site traffic, and understand where our audience is
            coming from. To learn more, please read our privacy policy.
          </p>
        </div>

        <menu className={styles['c-cookie-banner__actions']}>
          <button
            type="button"
            className={`${styles['c-cookie-banner__btn']} ${styles['c-cookie-banner__btn--accept']}`}
            onClick={() => handleConsent(TRACKING_CONSENT.GRANTED)}
          >
            Accept
          </button>
          <button
            type="button"
            className={`${styles['c-cookie-banner__btn']} ${styles['c-cookie-banner__btn--reject']}`}
            onClick={() => handleConsent(TRACKING_CONSENT.DENIED)}
          >
            Reject
          </button>
        </menu>
      </div>
    </section>
  );
};

export default CookieBanner;
