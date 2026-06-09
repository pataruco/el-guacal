import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { type MetaFunction, useNavigate, useParams } from 'react-router';
import Page from '@/components/page';
import StoreForm from '@/components/store/StoreForm';
import { useSubmitCreateStoreProposalMutation } from '@/graphql/mutations/submit-create-proposal/index.generated';
import i18n from '@/i18n/config';
import { resolveMetaLocale } from '@/i18n/locale';
import { selectAuth } from '@/store/features/auth/slice';
import {
  contributeFailed,
  contributeStarted,
  contributeSubmitted,
} from '@/store/features/tracking/thunks';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { getSeoMeta } from '@/utils/seo';

export const meta: MetaFunction = ({ params }) => {
  const { contentLocale, i18nLng } = resolveMetaLocale(params.locale);
  return getSeoMeta({
    description: i18n.t('seo.stores.new.description', { lng: i18nLng }),
    imageAlt: i18n.t('seo.imageAlt', { lng: i18nLng }),
    locale: i18nLng,
    path: `/${contentLocale}/stores/new`,
    title: i18n.t('seo.stores.new.title', { lng: i18nLng }),
  });
};

const NewStorePage = () => {
  const { locale } = useParams<{ locale: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
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

  // Fire once when an authenticated user actually sees the form, not on every
  // re-render or the brief unauthenticated frame before the redirect kicks in.
  useEffect(() => {
    if (isAuthenticated) {
      dispatch(contributeStarted());
    }
  }, [dispatch, isAuthenticated]);

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
      dispatch(contributeSubmitted(values.productIds.length));
      setSubmissionStatus('submitted');
    } catch (error) {
      dispatch(contributeFailed(error));
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
