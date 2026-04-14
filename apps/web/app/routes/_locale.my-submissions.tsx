import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { type MetaFunction, useNavigate, useParams } from 'react-router';
import Page from '@/components/page';
import ProposalStatusBadge from '@/components/proposal-status';
import { useMyStoreProposalsQuery } from '@/graphql/queries/my-proposals/index.generated';
import i18n from '@/i18n/config';
import { selectAuth } from '@/store/features/auth/slice';
import { useAppSelector } from '@/store/hooks';
import { getSeoMeta } from '@/utils/seo';

export const meta: MetaFunction = ({ params }) => {
  const locale = params.locale || 'en-GB';
  return getSeoMeta({
    description: i18n.t('seo.mySubmissions.description', { lng: locale }),
    locale,
    path: `/${locale}/my-submissions`,
    title: i18n.t('seo.mySubmissions.title', { lng: locale }),
  });
};

const MySubmissionsPage = () => {
  const { locale } = useParams<{ locale: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { isAuthenticated } = useAppSelector(selectAuth);
  const { data, isLoading } = useMyStoreProposalsQuery({});

  useEffect(() => {
    if (!isAuthenticated) {
      navigate(`/${locale}/auth`);
    }
  }, [isAuthenticated, navigate, locale]);

  if (!isAuthenticated) return null;

  return (
    <Page>
      <div style={{ margin: '0 auto', maxWidth: '800px', padding: '1rem' }}>
        <h1>{t('mySubmissions.title')}</h1>

        {isLoading && <output aria-live="polite">{t('common.loading')}</output>}

        {data?.myStoreProposals.edges.length === 0 && !isLoading && (
          <p>{t('mySubmissions.empty')}</p>
        )}

        {data?.myStoreProposals.edges.map(({ node }) => (
          <article
            key={node.proposalId}
            style={{
              borderBottom: '1px solid var(--color-border, #e5e7eb)',
              padding: '1rem 0',
            }}
          >
            <div style={{ alignItems: 'center', display: 'flex', gap: '0.5rem' }}>
              <strong>{node.proposedName || t('mySubmissions.deletion')}</strong>
              <ProposalStatusBadge status={node.status} />
              <span style={{ color: 'var(--color-muted, #6b7280)', fontSize: '0.875rem' }}>
                {t(`proposal.kind.${node.kind.toLowerCase()}`)}
              </span>
            </div>
            {node.proposedAddress && (
              <p style={{ color: 'var(--color-muted, #6b7280)', fontSize: '0.875rem', margin: '0.25rem 0' }}>
                {node.proposedAddress}
              </p>
            )}
            {node.reviewNote && node.status === 'REJECTED' && (
              <p style={{ color: 'var(--color-danger, #ef4444)', fontSize: '0.875rem', margin: '0.25rem 0' }}>
                {t('mySubmissions.moderatorNote')}: {node.reviewNote}
              </p>
            )}
            <time
              dateTime={node.createdAt}
              style={{ color: 'var(--color-muted, #6b7280)', fontSize: '0.75rem' }}
            >
              {new Date(node.createdAt).toLocaleDateString()}
            </time>
          </article>
        ))}
      </div>
    </Page>
  );
};

export default MySubmissionsPage;
