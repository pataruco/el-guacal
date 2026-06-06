import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useParams } from 'react-router';
import { useSubmitDeleteStoreProposalMutation } from '@/graphql/mutations/submit-delete-proposal/index.generated';
import { useGetStoreByIdQuery } from '@/graphql/queries/get-store-by-id/index.generated';
import type { Language } from '@/i18n/config';
import { formatDate } from '@/i18n/date';
import { selectAuth } from '@/store/features/auth/slice';
import { selectStoreState, setShowStore } from '@/store/features/stores/slice';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import DeleteConfirmationDialog from '../delete-store-dialogue';
import styles from './index.module.scss';

const Store: React.FC = () => {
  const { t } = useTranslation();
  const { locale } = useParams<{ locale: string }>();
  const lang: Language = locale === 'es' ? 'es-VE' : 'en-GB';
  const dispatch = useAppDispatch();

  const { storeId, show } = useAppSelector(selectStoreState);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  // Stable nonce for idempotent proposal submission. Re-keys when
  // the user opens a fresh store; one nonce per open-store
  // session keeps Submit-twice clicks idempotent without giving
  // a server-side duplicate.
  // biome-ignore lint/correctness/useExhaustiveDependencies: we only need to re-key when storeId changes
  const deleteProposalNonce = useMemo(() => crypto.randomUUID(), [storeId]);

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
  const [submitDeleteProposal] = useSubmitDeleteStoreProposalMutation();

  if (!show || isError || isLoading || !data) return null;

  const store = data.getStoreById;

  if (!store) return null;

  const {
    storeId: id,
    name,
    address,
    location,
    products = [],
    updatedAt,
    version,
  } = store;
  const lastUpdatedDatetime = updatedAt
    ? formatDate({ date: new Date(updatedAt), lang })
    : null;

  // Suggest deletion (proposal flow). Submits a delete proposal
  // that a moderator reviews — mirrors the edit flow which also
  // goes through proposals. Was a direct hard-delete (useDeleteStoreMutation)
  // before; community users shouldn't be able to remove locations
  // without moderator review.
  const handleDelete = async (reason: string) => {
    try {
      await submitDeleteProposal({
        input: {
          clientNonce: deleteProposalNonce,
          expectedVersion: version,
          reason,
          targetStoreId: id,
        },
      }).unwrap();
      setIsDeleteDialogOpen(false);
      handleOnClose();
    } catch (error) {
      console.error('Failed to submit delete proposal:', error);
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

          {/* X-icon close, sits in the top-right of the card per
              Figma. Was a labelled text button in the gov.uk
              direction. aria-label preserves the accessible name. */}
          <button
            type="button"
            onClick={handleOnClose}
            className={styles['c-store__close']}
            aria-label={t('store.close')}
          >
            <span aria-hidden="true">×</span>
          </button>
        </div>

        <a
          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location.lat)},${encodeURIComponent(location.lng)}`}
          target="_blank"
          rel="noopener noreferrer"
          className={styles['c-store__directions']}
          aria-label={`${t('store.directions')} (${t('store.opensInNewTab')})`}
        >
          {t('store.directions')}
          <span aria-hidden="true"> ↗</span>
        </a>

        {/* Products section — yellow accent pill per Figma. The
            checkmark prefix on each product is rendered via CSS
            ::before so the markup stays semantic (just <li>). */}
        <div className={styles['c-store__products']}>
          <h3 className={styles['c-store__products-title']}>
            {t('store.products')}
          </h3>
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

        {/* Suggest-an-edit link. Routes to the edit flow which
            handles auth-gating internally. Pencil icon prefix
            mirrors Figma's `Suggest an edit ✎` treatment. */}
        <Link
          to={`/${locale}/stores/${id}/edit`}
          className={styles['c-store__suggest-edit']}
        >
          <span aria-hidden="true">✎ </span>
          {t('store.suggestEdit')}
        </Link>

        {lastUpdatedDatetime && (
          <p className={styles['c-store__last-updated']}>
            {t('store.lastUpdatedAt', { datetime: lastUpdatedDatetime })}
          </p>
        )}

        {/* Authed moderation actions — kept for functionality but
            visually demoted below Suggest-an-edit. Edit links to
            the same route as suggest, so they read as related. */}
        {isAuthenticated && (
          <div className={styles['c-store__mod-actions']}>
            <button
              type="button"
              onClick={() => setIsDeleteDialogOpen(true)}
              className={`${styles['c-store__btn']} ${styles['c-store__btn--danger']}`}
            >
              {t('store.delete')}
            </button>
          </div>
        )}
      </section>

      <DeleteConfirmationDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDelete}
        itemName={name}
      />
    </div>
  );
};

export default Store;
