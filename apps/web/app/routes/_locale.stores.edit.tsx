import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { type MetaFunction, useNavigate, useParams } from 'react-router';
import Page from '@/components/page';
import StoreForm from '@/components/store/StoreForm';
import { useUpdateStoreMutation } from '@/graphql/mutations/update-store/index.generated';
import { useGetStoreByIdQuery } from '@/graphql/queries/get-store-by-id/index.generated';
import i18n from '@/i18n/config';
import { selectAuth } from '@/store/features/auth/slice';
import { useAppSelector } from '@/store/hooks';
import { getSeoMeta } from '@/utils/seo';

export const meta: MetaFunction = ({ params }) => {
  const { id, locale = 'en-GB' } = params;
  return getSeoMeta({
    description: i18n.t('seo.home.description', { lng: locale }),
    locale,
    path: `/${locale}/stores/${id}/edit`,
    title: i18n.t('seo.stores.edit.title', { lng: locale }),
  });
};

const EditStorePage = () => {
  const { id, locale } = useParams<{ id: string; locale: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { isAuthenticated } = useAppSelector(selectAuth);

  const { data, isLoading } = useGetStoreByIdQuery({ storeId: id as string });
  const [updateStore] = useUpdateStoreMutation();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate(`/${locale}/auth`);
    }
  }, [isAuthenticated, navigate, locale]);

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
    lat: store.location.lat,
    lng: store.location.lng,
    name: store.name,
    productIds: store.products.map((p) => p.productId),
  };

  const handleSubmit = async (values: {
    address: string;
    lat: number;
    lng: number;
    name: string;
    productIds: string[];
  }) => {
    try {
      await updateStore({
        input: {
          address: values.address,
          lat: values.lat,
          lng: values.lng,
          name: values.name,
          productIds: values.productIds,
          storeId: id as string,
        },
      }).unwrap();
      navigate(`/${locale}`);
    } catch (error) {
      console.error('Failed to update store:', error);
    }
  };

  if (!isAuthenticated) return null;

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
