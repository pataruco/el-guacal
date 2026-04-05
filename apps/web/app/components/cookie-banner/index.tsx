import { useEffect, useState } from 'react';
import { useLocalStorage } from '@/hooks/use-local-storage';
import {
  LOCAL_STORAGE_KEY_TRACKING_KEY,
  TRACKING_CONSENT,
} from '@/utils/analytics';

const CookieBanner = () => {
  const [isHydrated, setIsHydrated] = useState(false);
  const [consent, setConsent] = useLocalStorage(LOCAL_STORAGE_KEY_TRACKING_KEY);

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
    <section>
      <h2>Cookies on El Guacal</h2>
      <p>
        We use essential cookies to improve your browsing experience on our
        website, analyse site traffic, and understand where our audience is
        coming from. To learn more, please read our privacy policy.
      </p>

      <menu>
        <button
          type="button"
          className="button button--on-light"
          onClick={() => setConsent(TRACKING_CONSENT.GRANTED)}
        >
          Accept
        </button>
        <button
          type="button"
          className="button button--on-dark"
          onClick={() => setConsent(TRACKING_CONSENT.DENIED)}
        >
          Reject
        </button>
      </menu>
    </section>
  );
};

export default CookieBanner;
