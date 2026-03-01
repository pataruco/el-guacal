import StoreForm from '@/components/store-form';
import { useCreateStoreMutation } from '@/graphql/mutations/create-store/index.generated';
import { useDeleteStoreMutation } from '@/graphql/mutations/delete-store/index.generated';
import { useUpdateStoreMutation } from '@/graphql/mutations/update-store/index.generated';
import { useGetStoreByIdQuery } from '@/graphql/queries/get-store-by-id/index.generated';
import { selectMap } from '@/store/features/map/slice';
import { setIsCreating, selectStoreState, setShowStore } from '@/store/features/stores/slice';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { formatDate } from '@/utils/date-utils';
import { useState } from 'react';
import styles from './index.module.scss';

const Store: React.FC = () => {
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);
  const { storeId, show, isCreating } = useAppSelector(selectStoreState);
  const { center } = useAppSelector(selectMap);

  const [isEditing, setIsEditing] = useState(false);

  const handleOnClose = () => {
    dispatch(setShowStore(false));
    dispatch(setIsCreating(false));
    setIsEditing(false);
  };

  const { data, isLoading, isError, refetch } = useGetStoreByIdQuery(
    { storeId },
    { skip: isCreating || !storeId }
  );

  const [deleteStore] = useDeleteStoreMutation();
  const [updateStore] = useUpdateStoreMutation();
  const [createStore] = useCreateStoreMutation();

  if (!show) return null;

  if (isCreating) {
    return (
      <section className={styles.store}>
        <StoreForm
          title="Create Store"
          initialValues={{
            name: '',
            address: '',
            lat: center.lat,
            lng: center.lng,
            productIds: [],
          }}
          onSubmit={async (values) => {
            await createStore({
              input: {
                name: values.name,
                address: values.address,
                lat: values.lat,
                lng: values.lng,
                productIds: values.productIds,
              },
            });
            handleOnClose();
          }}
          onCancel={handleOnClose}
        />
      </section>
    );
  }

  if (isError || isLoading || !data) return null;

  const store = data.getStoreById;

  if (!store) return null;

  const { name, address, products, updatedAt, location } = store;

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this store?')) {
      await deleteStore({ id: storeId });
      handleOnClose();
    }
  };

  const handleUpdate = async (values: any) => {
    await updateStore({
      input: {
        storeId,
        name: values.name,
        address: values.address,
        lat: values.lat,
        lng: values.lng,
        productIds: values.productIds,
      },
    });
    setIsEditing(false);
    refetch();
  };

  return (
    <section className={styles.store}>
      {isEditing ? (
        <StoreForm
          title="Edit Store"
          initialValues={{
            name,
            address,
            lat: location.lat,
            lng: location.lng,
            productIds: products.map((p) => p.productId),
          }}
          onSubmit={handleUpdate}
          onCancel={() => setIsEditing(false)}
        />
      ) : (
        <>
          <h2>{name}</h2>

          <a
            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location.lat)},${encodeURIComponent(location.lng)}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            Directions
          </a>

          <h3>Address</h3>
          <p>{address}</p>

          <h3>Products</h3>
          <ul>
            {products.map((product) => (
              <li key={product.productId}>{product.name}</li>
            ))}
          </ul>

          <p>Last updated at: {formatDate(new Date(updatedAt))} </p>

          {user && (
            <div className={styles.store__admin_actions}>
              <button type="button" onClick={() => setIsEditing(true)}>
                Edit
              </button>
              <button type="button" onClick={handleDelete}>
                Delete
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={handleOnClose}
            className={styles.store__button}
          >
            close
          </button>
        </>
      )}
    </section>
  );
};

export default Store;
