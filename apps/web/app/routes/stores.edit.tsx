import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router';
import StoreForm from '@/components/store/StoreForm';
import { supportedLngs } from '../i18n';
import { useUpdateStoreMutation } from '@/graphql/mutations/update-store/index.generated';
import { useGetStoreByIdQuery } from '@/graphql/queries/get-store-by-id/index.generated';
import { selectAuth } from '@/store/features/auth/slice';
import { useAppSelector } from '@/store/hooks';

const EditStorePage = () => {
  const { lang, id } = useParams<{ lang?: string; id: string }>();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { isAuthenticated } = useAppSelector(selectAuth);

  const { data, isLoading } = useGetStoreByIdQuery({ storeId: id as string });
  const [updateStore] = useUpdateStoreMutation();

  useEffect(() => {
    if (!lang) {
      const detectedLng = localStorage.getItem('i18nextLng') || i18n.language || 'en-GB';
      const targetLng = supportedLngs.includes(detectedLng) ? detectedLng : 'en-GB';
      navigate(`/${targetLng}/stores/${id}/edit`, { replace: true });
    }
  }, [lang, i18n.language, navigate, id]);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate(lang ? `/${lang}/auth` : '/auth');
    }
  }, [isAuthenticated, navigate, lang]);

  if (!lang) {
    return null;
  }

  if (isLoading) return <div>Loading...</div>;
  if (!data?.getStoreById) return <div>Store not found</div>;

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
      navigate('/');
    } catch (error) {
      console.error('Failed to update store:', error);
    }
  };

  if (!isAuthenticated) return null;

  return (
    <StoreForm
      title={t('storeForm.editTitle')}
      initialValues={initialValues}
      onSubmit={handleSubmit}
    />
  );
};

export default EditStorePage;
