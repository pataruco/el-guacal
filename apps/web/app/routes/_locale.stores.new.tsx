import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { type MetaFunction, useNavigate, useParams } from 'react-router';
import Page from '@/components/page';
import StoreForm from '@/components/store/StoreForm';
import { useCreateStoreMutation } from '@/graphql/mutations/create-store/index.generated';
import i18n from '@/i18n/config';
import { selectAuth } from '@/store/features/auth/slice';
import { useAppSelector } from '@/store/hooks';
import { getSeoMeta } from '@/utils/seo';

export const meta: MetaFunction = ({ params }) => {
  const locale = params.locale || 'en-GB';
  return getSeoMeta({
    description: i18n.t('seo.home.description', { lng: locale }), // Use home description or keep generic
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
