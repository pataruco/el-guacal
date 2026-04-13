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
  // Skip until the user has asked to see a store AND we have a real
  // id. The GraphQL query is typed `$storeId: UUID!`, so firing with
  // the initial empty-string state throws a server-side validation
  // error on every page load and poisons the hook's error state.
  const { data, isLoading, isError } = useGetStoreByIdQuery(
    { storeId },
    { skip: !show || !storeId },
  );
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
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location.lat)},${encodeURIComponent(location.lng)}`}
              target="_blank"
              rel="noopener noreferrer"
              className={`${styles['c-store__btn']} ${styles['c-store__btn--primary']}`}
              aria-label={`${t('store.directions')} (${t('store.opensInNewTab')})`}
            >
              {t('store.directions')}
              <span aria-hidden="true"> ↗</span>
            </a>

            {isAuthenticated && (
              <>
                <Link
                  to={`/stores/${id}/edit`}
                  className={`${styles['c-store__btn']} ${styles['c-store__btn--secondary']}`}
                >
                  {t('store.edit')}
                </Link>
                <button
                  type="button"
                  onClick={() => setIsDeleteDialogOpen(true)}
                  className={`${styles['c-store__btn']} ${styles['c-store__btn--danger']}`}
                >
                  {t('store.delete')}
                </button>
              </>
            )}

            <button
              type="button"
              onClick={handleOnClose}
              className={styles['c-store__close']}
              aria-label={t('store.close')}
            >
              {t('store.close')}
            </button>
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
