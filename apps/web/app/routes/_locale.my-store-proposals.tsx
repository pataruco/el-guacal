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
import styles from './my-store-proposals.module.scss';

export const meta: MetaFunction = ({ params }) => {
  const locale = params.locale || 'en-GB';
  return getSeoMeta({
    description: i18n.t('seo.mySubmissions.description', { lng: locale }),
    locale,
    path: `/${locale}/my-store-proposals`,
    title: i18n.t('seo.mySubmissions.title', { lng: locale }),
  });
};

const MyStoreProposalsPage = () => {
  const { locale } = useParams<{ locale: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { isAuthenticated, isAuthReady } = useAppSelector(selectAuth);
  const { data, isLoading } = useMyStoreProposalsQuery(
    {},
    { skip: !isAuthenticated },
  );

  useEffect(() => {
    if (isAuthReady && !isAuthenticated) {
      navigate(`/${locale}/auth`);
    }
  }, [isAuthenticated, isAuthReady, navigate, locale]);

  if (!isAuthReady || !isAuthenticated) return null;

  return (
    <Page>
      <div className={styles['c-proposals']}>
        <h1 className={styles['c-proposals__title']}>
          {t('mySubmissions.title')}
        </h1>

        {isLoading && <output aria-live="polite">{t('common.loading')}</output>}

        {data?.myStoreProposals.edges.length === 0 && !isLoading && (
          <p className={styles['c-proposals__empty']}>
            {t('mySubmissions.empty')}
          </p>
        )}

        {data?.myStoreProposals.edges.map(({ node }) => (
          <article
            key={node.proposalId}
            className={styles['c-proposals__card']}
          >
            <div className={styles['c-proposals__header']}>
              <strong className={styles['c-proposals__name']}>
                {node.proposedName || t('mySubmissions.deletion')}
              </strong>
              <ProposalStatusBadge status={node.status} />
              <span className={styles['c-proposals__kind']}>
                {t(`proposal.kind.${node.kind.toLowerCase()}`)}
              </span>
            </div>
            {node.proposedAddress && (
              <p className={styles['c-proposals__address']}>
                {node.proposedAddress}
              </p>
            )}
            {node.reviewNote && node.status === 'REJECTED' && (
              <p className={styles['c-proposals__review-note']}>
                {t('mySubmissions.moderatorNote')}: {node.reviewNote}
              </p>
            )}
            <time
              dateTime={node.createdAt}
              className={styles['c-proposals__date']}
            >
              {new Date(node.createdAt).toLocaleDateString()}
            </time>
          </article>
        ))}
      </div>
    </Page>
  );
};

export default MyStoreProposalsPage;
