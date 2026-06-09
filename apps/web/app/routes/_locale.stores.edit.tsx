import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { type MetaFunction, useNavigate, useParams } from 'react-router';
import Page from '@/components/page';
import StoreForm from '@/components/store/StoreForm';
import { useSubmitUpdateStoreProposalMutation } from '@/graphql/mutations/submit-update-proposal/index.generated';
import { useGetStoreByIdQuery } from '@/graphql/queries/get-store-by-id/index.generated';
import i18n from '@/i18n/config';
import { resolveMetaLocale } from '@/i18n/locale';
import { selectAuth } from '@/store/features/auth/slice';
import {
  editFailed,
  editStarted,
  editSubmitted,
} from '@/store/features/tracking/thunks';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { getSeoMeta } from '@/utils/seo';

export const meta: MetaFunction = ({ params }) => {
  const { id } = params;
  const { contentLocale, i18nLng } = resolveMetaLocale(params.locale);
  return getSeoMeta({
    description: i18n.t('seo.stores.edit.description', { lng: i18nLng }),
    imageAlt: i18n.t('seo.imageAlt', { lng: i18nLng }),
    locale: i18nLng,
    path: `/${contentLocale}/stores/${id}/edit`,
    title: i18n.t('seo.stores.edit.title', { lng: i18nLng }),
  });
};

const EditStorePage = () => {
  const { id, locale } = useParams<{ id: string; locale: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const { isAuthenticated } = useAppSelector(selectAuth);
  const clientNonce = useMemo(() => crypto.randomUUID(), []);

  const { data, isLoading } = useGetStoreByIdQuery({ storeId: id as string });
  const [submitProposal] = useSubmitUpdateStoreProposalMutation();
  const [submissionStatus, setSubmissionStatus] = useState<
    'idle' | 'submitted'
  >('idle');

  useEffect(() => {
    if (!isAuthenticated) {
      navigate(`/${locale}/auth`);
    }
  }, [isAuthenticated, navigate, locale]);

  // Fire once when an authenticated user lands on a real store's edit form.
  // Gating on storeId means we don't double-count during the loading state.
  useEffect(() => {
    if (isAuthenticated && data?.getStoreById?.storeId) {
      dispatch(editStarted(data.getStoreById.storeId));
    }
  }, [dispatch, isAuthenticated, data?.getStoreById?.storeId]);

  if (isLoading)
    return (
      <Page>
        <output aria-live="polite">{t('common.loading')}</output>
      </Page>
    );
  if (!data?.getStoreById)
    return (
      <Page>
        <div role="alert">{t('common.notFound')}</div>
      </Page>
    );

  const store = data.getStoreById;
  const initialValues = {
    address: store.address,
    clientNonce,
    lat: store.location.lat,
    lng: store.location.lng,
    name: store.name,
    productIds: store.products.map((p) => p.productId),
  };

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
          expectedVersion: store.version,
          lat: values.lat,
          lng: values.lng,
          name: values.name,
          productIds: values.productIds,
          targetStoreId: id as string,
        },
      }).unwrap();
      // Diff against the original so we can answer "are edits typically
      // metadata corrections or product-list updates?" — same product set is
      // the closest signal we have today to "still stocking these" until a
      // dedicated confirm flow lands.
      const originalProductIds = new Set(initialValues.productIds);
      const submittedProductIds = new Set(values.productIds);
      const productsChanged =
        originalProductIds.size !== submittedProductIds.size ||
        [...originalProductIds].some((pid) => !submittedProductIds.has(pid));
      dispatch(
        editSubmitted({
          addressChanged: values.address !== initialValues.address,
          nameChanged: values.name !== initialValues.name,
          productCount: values.productIds.length,
          productsChanged,
          storeId: id as string,
        }),
      );
      setSubmissionStatus('submitted');
    } catch (error) {
      dispatch(editFailed({ error, storeId: id as string }));
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
      <StoreForm
        title={t('storeForm.editTitle')}
        initialValues={initialValues}
        onSubmit={handleSubmit}
      />
    </Page>
  );
};

export default EditStorePage;
