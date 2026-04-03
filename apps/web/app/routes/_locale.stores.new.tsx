import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router';
import Page from '@/components/page';
import StoreForm from '@/components/store/StoreForm';
import { useCreateStoreMutation } from '@/graphql/mutations/create-store/index.generated';
import { selectAuth } from '@/store/features/auth/slice';
import { useAppSelector } from '@/store/hooks';

const NewStorePage = () => {
  const { locale } = useParams<{ locale: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { isAuthenticated } = useAppSelector(selectAuth);
  const [createStore] = useCreateStoreMutation();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate(`/${locale}/auth`);
    }
  }, [isAuthenticated, navigate, locale]);

  const handleSubmit = async (values: {
    address: string;
    lat: number;
    lng: number;
    name: string;
    productIds: string[];
  }) => {
    try {
      await createStore({
        input: {
          address: values.address,
          lat: values.lat,
          lng: values.lng,
          name: values.name,
          productIds: values.productIds,
        },
      }).unwrap();
      navigate(`/${locale}`);
    } catch (error) {
      console.error('Failed to create store:', error);
    }
  };

  if (!isAuthenticated) return null;

  return (
    <Page>
      <StoreForm title={t('storeForm.addTitle')} onSubmit={handleSubmit} />
    </Page>
  );
};

export default NewStorePage;
