import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import ProposalStatusBadge from '../index';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

describe('ProposalStatusBadge', () => {
  it('renders the translated status text', () => {
    render(<ProposalStatusBadge status="PENDING" />);
    expect(screen.getByText('proposal.status.pending')).toBeDefined();
  });

  it('renders the translated text for approved status', () => {
    render(<ProposalStatusBadge status="APPROVED" />);
    expect(screen.getByText('proposal.status.approved')).toBeDefined();
  });

  it('renders the translated text for rejected status', () => {
    render(<ProposalStatusBadge status="REJECTED" />);
    expect(screen.getByText('proposal.status.rejected')).toBeDefined();
  });

  it('renders the translated text for withdrawn status', () => {
    render(<ProposalStatusBadge status="WITHDRAWN" />);
    expect(screen.getByText('proposal.status.withdrawn')).toBeDefined();
  });

  it('renders the translated text for superseded status', () => {
    render(<ProposalStatusBadge status="SUPERSEDED" />);
    expect(screen.getByText('proposal.status.superseded')).toBeDefined();
  });

  it('renders as a span element', () => {
    const { container } = render(<ProposalStatusBadge status="PENDING" />);
    expect(container.querySelector('span')).toBeDefined();
  });
});
