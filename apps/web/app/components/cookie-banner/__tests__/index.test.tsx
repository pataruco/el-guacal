import { fireEvent, render, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { LOCAL_STORAGE_KEY_TRACKING_KEY } from '@/utils/analytics';
import CookieBanner from '../index';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock('react-router', () => ({
  Link: ({ children }: { children: ReactNode }) => <a href="/">{children}</a>,
  useParams: () => ({ locale: 'en' }),
}));

type GtagWindow = Window & {
  dataLayer?: unknown[];
  gtag?: (...args: unknown[]) => void;
};

const gtag = () => (window as GtagWindow).gtag;

const createLocalStorageStub = () => {
  let store: Record<string, string> = {};
  return {
    clear: () => {
      store = {};
    },
    getItem: (key: string) => store[key] ?? null,
    removeItem: (key: string) => {
      delete store[key];
    },
    setItem: (key: string, value: string) => {
      store[key] = String(value);
    },
  } as Storage;
};

describe('CookieBanner consent persistence', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', createLocalStorageStub());
    (window as GtagWindow).dataLayer = [];
    (window as GtagWindow).gtag = vi.fn();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it('re-applies stored "granted" consent to gtag on mount', async () => {
    window.localStorage.setItem(
      LOCAL_STORAGE_KEY_TRACKING_KEY,
      JSON.stringify('granted'),
    );

    render(<CookieBanner />);

    await waitFor(() => {
      expect(gtag()).toHaveBeenCalledWith(
        'consent',
        'update',
        expect.objectContaining({ analytics_storage: 'granted' }),
      );
    });
  });

  it('re-applies stored "denied" consent to gtag on mount', async () => {
    window.localStorage.setItem(
      LOCAL_STORAGE_KEY_TRACKING_KEY,
      JSON.stringify('denied'),
    );

    render(<CookieBanner />);

    await waitFor(() => {
      expect(gtag()).toHaveBeenCalledWith(
        'consent',
        'update',
        expect.objectContaining({ analytics_storage: 'denied' }),
      );
    });
  });

  it('does not apply consent on mount when no choice is stored', async () => {
    render(<CookieBanner />);

    await new Promise((r) => setTimeout(r, 50));

    expect(gtag()).not.toHaveBeenCalled();
  });

  it('applies consent to gtag when the user clicks Accept', async () => {
    const { getByRole } = render(<CookieBanner />);

    fireEvent.click(getByRole('button', { name: 'cookieBanner.accept' }));

    await waitFor(() => {
      expect(gtag()).toHaveBeenCalledWith(
        'consent',
        'update',
        expect.objectContaining({ analytics_storage: 'granted' }),
      );
    });
  });
});
