// Inline Consent Mode bootstrap, injected into the document <head> and run
// BEFORE the GTM container (and the bundle) loads.
//
// It sets the privacy-safe default (everything denied) and then immediately
// re-applies a returning visitor's previously stored choice. Doing this here —
// rather than in a React effect after hydration — means consent is already
// correct when the tag fires its first `page_view`, instead of racing the
// `wait_for_update` window (slow hydration previously let the first hit go out
// as denied for returning visitors).
export const consentBootstrapScript = (storageKey: string) => `
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('consent', 'default', {
    'ad_storage': 'denied',
    'ad_user_data': 'denied',
    'ad_personalization': 'denied',
    'analytics_storage': 'denied',
    'wait_for_update': 500
  });
  try {
    var storedConsent = JSON.parse(localStorage.getItem('${storageKey}'));
    if (storedConsent === 'granted' || storedConsent === 'denied') {
      gtag('consent', 'update', {
        'ad_storage': storedConsent,
        'ad_user_data': storedConsent,
        'ad_personalization': storedConsent,
        'analytics_storage': storedConsent
      });
    }
  } catch (e) {}
`;
