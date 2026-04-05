export const GTM_ID = 'GTM-TKQ877L3';
export const LOCAL_STORAGE_KEY_TRACKING_KEY = 'tracking_consent';

export const TRACKING_CONSENT = {
  DENIED: 'denied',
  GRANTED: 'granted',
} as const;

export type TRACKING_CONSENT =
  (typeof TRACKING_CONSENT)[keyof typeof TRACKING_CONSENT];

type DataLayerWindow = Window & {
  dataLayer?: Array<Record<string, unknown> | IArguments>;
};

export const updateConsent = (consent: TRACKING_CONSENT) => {
  if (typeof window === 'undefined') return;
  const w = window as DataLayerWindow;
  w.dataLayer = w.dataLayer || [];
  w.dataLayer.push({
    ad_personalization: consent,
    ad_storage: consent,
    ad_user_data: consent,
    analytics_storage: consent,
    event: 'consent_update',
  });
};
