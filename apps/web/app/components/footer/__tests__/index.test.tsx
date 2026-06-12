import { render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import Footer from '../index';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock('react-router', () => ({
  Link: ({ to, children, ...rest }: { to: string; children: ReactNode }) => (
    <a href={to} {...rest}>
      {children}
    </a>
  ),
  useParams: () => ({ locale: 'en' }),
}));

describe('Footer', () => {
  it.each([
    { kind: 'API', tagPrefix: 'server-v' },
    { kind: 'Web', tagPrefix: 'web-v' },
  ])('renders the $kind version as a link to the $tagPrefix release tag', ({
    kind,
    tagPrefix,
  }) => {
    render(<Footer />);

    const link = screen.getByRole('link', {
      name: new RegExp(`^${kind} \\d+\\.\\d+\\.\\d+$`),
    });

    expect(link.getAttribute('href')).toMatch(
      new RegExp(
        `^https://github\\.com/pataruco/el-guacal/releases/tag/${tagPrefix}\\d+\\.\\d+\\.\\d+$`,
      ),
    );
    expect(link.getAttribute('target')).toBe('_blank');
    expect(link.getAttribute('rel')).toBe('noopener noreferrer');
  });

  it('hides the separator from screen readers', () => {
    render(<Footer />);

    expect(screen.getByText('|').getAttribute('aria-hidden')).toBe('true');
  });
});
