import { fireEvent, render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import LanguageSwitcher from '../index';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock('@/i18n', () => ({
  SUPPORTED_LOCALES: ['en', 'es'],
}));

vi.mock('react-router', () => ({
  Link: ({ to, children, ...rest }: { to: string; children: ReactNode }) => (
    <a href={to} {...rest}>
      {children}
    </a>
  ),
  useLocation: () => ({ pathname: '/en/about' }),
  useParams: () => ({ locale: 'en' }),
}));

describe('LanguageSwitcher', () => {
  it('shows the other locale as a link that keeps the current page', () => {
    render(<LanguageSwitcher variant="inline" />);

    const spanish = screen.getByRole('link', { name: 'Español' });
    expect(spanish.getAttribute('href')).toBe('/es/about');
    expect(spanish.getAttribute('lang')).toBe('es');
    expect(spanish.getAttribute('hreflang')).toBe('es');
  });

  it('renders the current locale as a non-link marked with aria-current', () => {
    render(<LanguageSwitcher variant="inline" />);

    expect(screen.queryByRole('link', { name: 'English' })).toBeNull();
    const current = screen.getByText('English');
    expect(current.getAttribute('aria-current')).toBe('true');
    expect(current.getAttribute('lang')).toBe('en');
  });

  it('calls onNavigate when a locale link is clicked', () => {
    const onNavigate = vi.fn();
    render(<LanguageSwitcher variant="menu" onNavigate={onNavigate} />);

    fireEvent.click(screen.getByRole('link', { name: 'Español' }));

    expect(onNavigate).toHaveBeenCalledOnce();
  });

  it('shows a visible label in the menu variant', () => {
    render(<LanguageSwitcher variant="menu" />);

    const list = screen.getByRole('list', { name: 'nav.languageSelector' });
    expect(list).toBeTruthy();
  });
});
