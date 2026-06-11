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
  it('renders the API version as a link to the server release tag', () => {
    render(<Footer />);

    const apiLink = screen.getByRole('link', { name: /^API \d+\.\d+\.\d+$/ });

    expect(apiLink.getAttribute('href')).toMatch(
      /^https:\/\/github\.com\/pataruco\/el-guacal\/releases\/tag\/server-v\d+\.\d+\.\d+$/,
    );
    expect(apiLink.getAttribute('target')).toBe('_blank');
    expect(apiLink.getAttribute('rel')).toBe('noopener noreferrer');
  });

  it('renders the Web version as a link to the web release tag', () => {
    render(<Footer />);

    const webLink = screen.getByRole('link', { name: /^Web \d+\.\d+\.\d+$/ });

    expect(webLink.getAttribute('href')).toMatch(
      /^https:\/\/github\.com\/pataruco\/el-guacal\/releases\/tag\/web-v\d+\.\d+\.\d+$/,
    );
    expect(webLink.getAttribute('target')).toBe('_blank');
    expect(webLink.getAttribute('rel')).toBe('noopener noreferrer');
  });
});
