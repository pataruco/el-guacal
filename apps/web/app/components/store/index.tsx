import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { useDeleteStoreMutation } from '@/graphql/mutations/delete-store/index.generated';
import { useGetStoreByIdQuery } from '@/graphql/queries/get-store-by-id/index.generated';
import { ENGLISH, type Language } from '@/locales/i18n';
import { selectAuth } from '@/store/features/auth/slice';
import { selectStoreState, setShowStore } from '@/store/features/stores/slice';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { formatDate } from '@/utils/date-utils';
import DeleteConfirmationDialog from '../delete-store-dialogue';
import styles from './index.module.scss';

const Store: React.FC = () => {
  const { t, i18n } = useTranslation();
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
    <div className={styles['c-store-container']}>
      <section className={styles['c-store']}>
        <div className={styles['c-store__image']}>
          <img
            src="https://via.placeholder.com/80x80/F4F6F9/0A1931?text=Store"
            alt={name}
          />
        </div>

        <div className={styles['c-store__content']}>
          <div className={styles['c-store__header']}>
            <span className={styles['c-store__badge']}>STORE</span>
            <h2>{name}</h2>
          </div>
          <p className={styles['c-store__address']}>{address}</p>
          <p className={styles['c-store__meta']}>
            {t('store.lastUpdated')}:{' '}
            {formatDate({
              date: new Date(updatedAt),
              lang: (i18n.language ?? ENGLISH) as Language,
            })}{' '}
          </p>
        </div>

        <div className={styles['c-store__actions']}>
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

        <button
          type="button"
          onClick={handleOnClose}
          className={styles['c-store__close']}
          aria-label={t('store.close')}
        >
          &times;
        </button>
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
