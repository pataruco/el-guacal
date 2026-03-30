import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { useDeleteStoreMutation } from '@/graphql/mutations/delete-store/index.generated';
import { useGetStoreByIdQuery } from '@/graphql/queries/get-store-by-id/index.generated';
import { selectAuth } from '@/store/features/auth/slice';
import { selectStoreState, setShowStore } from '@/store/features/stores/slice';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import DeleteConfirmationDialog from '../delete-store-dialogue';
import styles from './index.module.scss';

const Store: React.FC = () => {
  const { t } = useTranslation();
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

  const { storeId: id, name, address, location, products = [] } = store;

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
    <div className={styles['c-store-container']}>
      <section className={styles['c-store']}>
        <div className={styles['c-store__header']}>
          <div className={styles['c-store__content']}>
            <h2>{name}</h2>
            <p className={styles['c-store__address']}>{address}</p>
          </div>

          <div className={styles['c-store__header-actions']}>
            <button
              type="button"
              onClick={handleOnClose}
              className={styles['c-store__close']}
              aria-label={t('store.close')}
            >
              &times;
            </button>
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location.lat)},${encodeURIComponent(location.lng)}`}
              target="_blank"
              rel="noopener noreferrer"
              className={`${styles['c-store__btn']} ${styles['c-store__btn--primary']}`}
            >
              {t('store.directions')}
            </a>

            {isAuthenticated && (
              <>
                <Link
                  to={`/stores/${id}/edit`}
                  className={`${styles['c-store__btn']} ${styles['c-store__btn--secondary']}`}
                >
                  Edit
                </Link>
                <button
                  type="button"
                  onClick={() => setIsDeleteDialogOpen(true)}
                  className={`${styles['c-store__btn']} ${styles['c-store__btn--danger']}`}
                >
                  Delete
                </button>
              </>
            )}
          </div>
        </div>

        <div className={styles['c-store__products']}>
          <h3>{t('store.products')}</h3>
          <ul className={styles['c-store__products-list']}>
            {products.map((product) => (
              <li
                key={product.productId}
                className={styles['c-store__product']}
              >
                {product.name}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <DeleteConfirmationDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDelete}
        itemName={name}
        itemType="Store"
      />
    </div>
  );
};

export default Store;
