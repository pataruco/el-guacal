import { useTranslation } from 'react-i18next';

interface ProposalStatusBadgeProps {
  status: string;
}

const ProposalStatusBadge: React.FC<ProposalStatusBadgeProps> = ({ status }) => {
  const { t } = useTranslation();

  const colorMap: Record<string, string> = {
    APPROVED: 'var(--color-success)',
    PENDING: 'var(--color-warning, #f59e0b)',
    REJECTED: 'var(--color-danger, #ef4444)',
    SUPERSEDED: 'var(--color-muted, #6b7280)',
    WITHDRAWN: 'var(--color-muted, #6b7280)',
  };

  return (
    <span
      style={{
        backgroundColor: colorMap[status] || '#6b7280',
        borderRadius: '4px',
        color: 'white',
        fontSize: '0.75rem',
        fontWeight: 600,
        padding: '2px 8px',
      }}
    >
      {t(`proposal.status.${status.toLowerCase()}`)}
    </span>
  );
};

export default ProposalStatusBadge;
