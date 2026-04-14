import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { type MetaFunction, useNavigate, useParams } from 'react-router';
import Page from '@/components/page';
import StoreForm from '@/components/store/StoreForm';
import { useSubmitCreateStoreProposalMutation } from '@/graphql/mutations/submit-create-proposal/index.generated';
import i18n from '@/i18n/config';
import { selectAuth } from '@/store/features/auth/slice';
import { useAppSelector } from '@/store/hooks';
import { getSeoMeta } from '@/utils/seo';

export const meta: MetaFunction = ({ params }) => {
  const locale = params.locale || 'en-GB';
  return getSeoMeta({
    description: i18n.t('seo.home.description', { lng: locale }),
    locale,
    path: `/${locale}/stores/new`,
    title: i18n.t('seo.stores.new.title', { lng: locale }),
  });
};

const NewStorePage = () => {
  const { locale } = useParams<{ locale: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { isAuthenticated } = useAppSelector(selectAuth);
  const [submitProposal] = useSubmitCreateStoreProposalMutation();
  const [submissionStatus, setSubmissionStatus] = useState<
    'idle' | 'submitted'
  >('idle');

  useEffect(() => {
    if (!isAuthenticated) {
      navigate(`/${locale}/auth`);
    }
  }, [isAuthenticated, navigate, locale]);

  const handleSubmit = async (values: {
    address: string;
    clientNonce: string;
    lat: number;
    lng: number;
    name: string;
    productIds: string[];
  }) => {
    try {
      await submitProposal({
        input: {
          address: values.address,
          clientNonce: values.clientNonce,
          lat: values.lat,
          lng: values.lng,
          name: values.name,
          productIds: values.productIds,
        },
      }).unwrap();
      setSubmissionStatus('submitted');
    } catch (error) {
      console.error('Failed to submit proposal:', error);
    }
  };

  if (!isAuthenticated) return null;

  if (submissionStatus === 'submitted') {
    return (
      <Page>
        <div style={{ padding: '2rem', textAlign: 'center' }}>
          <h1>{t('proposal.submitted.title')}</h1>
          <p>{t('proposal.submitted.message')}</p>
          <button type="button" onClick={() => navigate(`/${locale}`)}>
            {t('proposal.submitted.backToMap')}
          </button>
        </div>
      </Page>
    );
  }

  return (
    <Page>
      <StoreForm title={t('storeForm.addTitle')} onSubmit={handleSubmit} />
    </Page>
  );
};

export default NewStorePage;
