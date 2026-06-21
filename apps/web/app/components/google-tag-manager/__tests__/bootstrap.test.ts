import { describe, expect, it } from 'vitest';
import { consentBootstrapScript } from '../bootstrap';

// This is an inline <head> snippet (a string injected before the bundle runs),
// so it is verified by its contract here and behaviourally in the browser.
describe('consentBootstrapScript', () => {
  const script = consentBootstrapScript('tracking_consent');

  it('sets a denied consent default with a wait-for-update window', () => {
    expect(script).toContain("gtag('consent', 'default'");
    expect(script).toContain('wait_for_update');
    expect(script).toContain("'analytics_storage': 'denied'");
  });

  it('reads the stored consent from the provided storage key', () => {
    expect(script).toContain("localStorage.getItem('tracking_consent')");
  });

  it('re-applies a previously stored choice via a guarded consent update', () => {
    // acts only on a valid stored value
    expect(script).toContain("=== 'granted'");
    expect(script).toContain("=== 'denied'");
    // and propagates it through a consent update before the tag loads
    expect(script).toContain("gtag('consent', 'update'");
    expect(script).toContain("'analytics_storage': storedConsent");
  });

  it('is resilient to storage access throwing', () => {
    expect(script).toContain('try');
    expect(script).toContain('catch');
  });
});
