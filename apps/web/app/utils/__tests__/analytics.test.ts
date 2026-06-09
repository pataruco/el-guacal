import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TRACKING_CONSENT, track, updateConsent } from '../analytics';

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

describe('track', () => {
  beforeEach(() => {
    (window as GtagWindow).dataLayer = [];
  });

  it('pushes the event name to the dataLayer', () => {
    track('locate_me_clicked');

    expect((window as GtagWindow).dataLayer).toEqual([
      { event: 'locate_me_clicked' },
    ]);
  });

  it('merges parameters into the dataLayer entry', () => {
    track('search_result_opened', {
      has_active_search: true,
      product_count: 2,
      store_id: 'abc-123',
    });

    expect((window as GtagWindow).dataLayer).toEqual([
      {
        event: 'search_result_opened',
        has_active_search: true,
        product_count: 2,
        store_id: 'abc-123',
      },
    ]);
  });

  it('initialises dataLayer when missing', () => {
    (window as GtagWindow).dataLayer = undefined;

    track('contribute_started');

    expect((window as GtagWindow).dataLayer).toEqual([
      { event: 'contribute_started' },
    ]);
  });
});
