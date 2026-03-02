import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router';
import StoreForm from '@/components/store/StoreForm';
import { useGetStoreByIdQuery } from '@/graphql/queries/get-store-by-id/index.generated';
import { useUpdateStoreMutation } from '@/graphql/mutations/update-store/index.generated';
import { useAppSelector } from '@/store/hooks';
import { selectAuth } from '@/store/features/auth/slice';

const EditStorePage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useAppSelector(selectAuth);

  const { data, isLoading } = useGetStoreByIdQuery({ storeId: id as string });
  const [updateStore] = useUpdateStoreMutation();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/auth');
    }
  }, [isAuthenticated, navigate]);

  if (isLoading) return <div>Loading...</div>;
  if (!data?.getStoreById) return <div>Store not found</div>;

  const store = data.getStoreById;
  const initialValues = {
    address: store.address,
    lat: store.location.lat,
    lng: store.location.lng,
    name: store.name,
    productIds: store.products.map(p => p.productId),
  };

  const handleSubmit = async (values: any) => {
    try {
      await updateStore({
        input: {
          address: values.address,
          location: {
            lat: values.lat,
            lng: values.lng,
          },
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
      title="Edit Store"
      initialValues={initialValues}
      onSubmit={handleSubmit}
    />
  );
};

export default EditStorePage;
