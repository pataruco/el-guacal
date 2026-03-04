import { useState } from 'react';
import { Link } from 'react-router';
import { useDeleteStoreMutation } from '@/graphql/mutations/delete-store/index.generated';
import { useGetStoreByIdQuery } from '@/graphql/queries/get-store-by-id/index.generated';
import { selectAuth } from '@/store/features/auth/slice';
import { selectStoreState, setShowStore } from '@/store/features/stores/slice';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { formatDate } from '@/utils/date-utils';
import DeleteConfirmationDialog from '../delete-store-dialogue';
import styles from './index.module.scss';

const Store: React.FC = () => {
  const dispatch = useAppDispatch();

  const { storeId, show } = useAppSelector(selectStoreState);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const handleOnClose = () => {
    dispatch(setShowStore(false));
  };

  const { isAuthenticated } = useAppSelector(selectAuth);
  const { data, isLoading, isError } = useGetStoreByIdQuery({ storeId });
  const [deleteStore] = useDeleteStoreMutation();

  if (!show || isError || isLoading || !data) return null;

  const store = data.getStoreById;

  if (!store) return null;

  const { storeId: id, name, address, products, updatedAt, location } = store;

  const handleDelete = async () => {
    try {
      await deleteStore({ id }).unwrap();
      setIsDeleteDialogOpen(false);
      handleOnClose();
    } catch (error) {
      console.error('Failed to delete store:', error);
    }
  };

  return (
    <section className={styles.store}>
      <h2>{name}</h2>

      {isAuthenticated && (
        <div className={styles.actions}>
          <Link to={`/stores/${id}/edit`} className={styles.editBtn}>
            Edit
          </Link>
          <button
            type="button"
            onClick={() => setIsDeleteDialogOpen(true)}
            className={styles.deleteBtn}
          >
            Delete
          </button>
        </div>
      )}

      <DeleteConfirmationDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDelete}
        itemName={name}
        itemType="Store"
      />

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

      <button
        type="button"
        onClick={handleOnClose}
        className={styles.store__button}
      >
        close
      </button>
    </section>
  );
};

export default Store;
