import { fireEvent, render, screen, within } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import Header from '../index';

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
  useLocation: () => ({ pathname: '/en' }),
  useNavigate: () => vi.fn(),
  useParams: () => ({ locale: 'en' }),
}));

vi.mock('@/store/hooks', () => ({
  useAppSelector: () => ({ isAuthenticated: false }),
}));

vi.mock('@/utils/firebase', () => ({
  auth: { signOut: vi.fn() },
}));

vi.mock('@/hooks/use-focus-trap', () => ({
  useFocusTrap: vi.fn(),
}));

vi.mock('@base-ui/react/select', () => {
  const Passthrough = ({ children }: { children?: ReactNode }) => (
    <div>{children}</div>
  );
  return {
    Select: {
      Icon: Passthrough,
      Item: Passthrough,
      Popup: Passthrough,
      Portal: Passthrough,
      Positioner: Passthrough,
      Root: Passthrough,
      Trigger: Passthrough,
      Value: Passthrough,
    },
  };
});

describe('Header mobile menu', () => {
  it('has an Add location link to /stores/new inside the mobile menu', () => {
    render(<Header />);

    // open the mobile menu so its contents leave the inert subtree
    fireEvent.click(screen.getByRole('button', { name: 'nav.menu' }));

    const dialog = screen.getByRole('dialog', { name: 'nav.menu' });
    const addLocation = within(dialog).getByRole('link', {
      name: 'nav.addLocation',
    });

    expect(addLocation.getAttribute('href')).toBe('/en/stores/new');
  });
});
