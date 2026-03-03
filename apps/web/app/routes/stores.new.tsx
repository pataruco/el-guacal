import { useEffect } from 'react';
import { useNavigate } from 'react-router';
import StoreForm from '@/components/store/StoreForm';
import { useCreateStoreMutation } from '@/graphql/mutations/create-store/index.generated';
import { selectAuth } from '@/store/features/auth/slice';
import { useAppSelector } from '@/store/hooks';

const NewStorePage = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAppSelector(selectAuth);
  const [createStore] = useCreateStoreMutation();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/auth');
    }
  }, [isAuthenticated, navigate]);

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
      navigate('/');
    } catch (error) {
      console.error('Failed to create store:', error);
    }
  };

  if (!isAuthenticated) return null;

  return <StoreForm title="Add New Store" onSubmit={handleSubmit} />;
};

export default NewStorePage;
