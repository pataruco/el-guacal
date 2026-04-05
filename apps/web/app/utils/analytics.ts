export const GA_ID = 'GTM-TKQ877L3';
export const LOCAL_STORAGE_KEY_TRACKING_KEY = 'tracking_consent';

export const TRACKING_CONSENT = {
  DENIED: 'denied',
  GRANTED: 'granted',
} as const;

export type TRACKING_CONSENT =
  (typeof TRACKING_CONSENT)[keyof typeof TRACKING_CONSENT];
