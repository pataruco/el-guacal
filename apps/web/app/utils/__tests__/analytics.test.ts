import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TRACKING_CONSENT, updateConsent } from '../analytics';

type GtagWindow = Window & {
  dataLayer?: unknown[];
  gtag?: (...args: unknown[]) => void;
};

describe('updateConsent', () => {
  beforeEach(() => {
    const w = window as GtagWindow;
    w.dataLayer = [];
    w.gtag = vi.fn();
  });

  it('grants consent through the Google Consent Mode API', () => {
    updateConsent(TRACKING_CONSENT.GRANTED);

    expect((window as GtagWindow).gtag).toHaveBeenCalledWith(
      'consent',
      'update',
      {
        ad_personalization: 'granted',
        ad_storage: 'granted',
        ad_user_data: 'granted',
        analytics_storage: 'granted',
      },
    );
  });

  it('denies consent through the Google Consent Mode API', () => {
    updateConsent(TRACKING_CONSENT.DENIED);

    expect((window as GtagWindow).gtag).toHaveBeenCalledWith(
      'consent',
      'update',
      {
        ad_personalization: 'denied',
        ad_storage: 'denied',
        ad_user_data: 'denied',
        analytics_storage: 'denied',
      },
    );
  });

  it('does not throw when gtag is not yet available', () => {
    (window as GtagWindow).gtag = undefined;

    expect(() => updateConsent(TRACKING_CONSENT.GRANTED)).not.toThrow();
  });
});
