import { useTranslation } from 'react-i18next';
import styles from './index.module.scss';

interface ProposalStatusBadgeProps {
  status: string;
}

const ProposalStatusBadge: React.FC<ProposalStatusBadgeProps> = ({
  status,
}) => {
  const { t } = useTranslation();
  const modifier = status.toLowerCase();

  return (
    <span
      className={`${styles['c-status-badge']} ${styles[`c-status-badge--${modifier}`] || ''}`}
    >
      {t(`proposal.status.${modifier}`)}
    </span>
  );
};

export default ProposalStatusBadge;
