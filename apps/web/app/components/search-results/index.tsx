// SearchResults — list of stores matching the active product
// filter, rendered on the home page left column when the user
// has selected products via ProductFilter (Figma section
// 77:11036 "search for items/locations").
//
// Data flow:
//   ProductFilter dispatches `toggleProductId` → map slice
//   `selectedProductIds`. Both this list AND the MapComponent
//   read the same Redux state and call `useGetStoresNearQuery`
//   with the same params. RTK Query caches the response so it's
//   one network request shared between list + map.
//
// Selection:
//   Clicking a list item dispatches `setStoreId` + `setShowStore`
//   — the SAME flow as clicking a marker on the map. So the
//   selected list item, the highlighted marker, and the
//   slide-out store detail panel stay in sync automatically.
import { useTranslation } from 'react-i18next';
import { useAllProductsQuery } from '@/graphql/queries/all-products/index.generated';
import { useGetStoresNearQuery } from '@/graphql/queries/get-stores-near/index.generated';
import type { Radius } from '@/graphql/types';
import { selectMap } from '@/store/features/map/slice';
import {
  selectStoreState,
  setShowStore,
  setStoreId,
} from '@/store/features/stores/slice';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import styles from './index.module.scss';

const SearchResults: React.FC = () => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const { center, zoom, selectedProductIds } = useAppSelector(selectMap);
  const { storeId: selectedStoreId } = useAppSelector(selectStoreState);
  const { data: productsData } = useAllProductsQuery();

  // Same radius math as MapComponent — keeps the two queries' cache
  // keys identical so RTK Query serves both from one network call.
  const roundedZoom = Math.round(zoom);
  const skip = roundedZoom < 11 || roundedZoom > 22;
  const radius = skip ? 'ZOOM_11' : (`ZOOM_${roundedZoom}` as Radius);

  const { data, isLoading } = useGetStoresNearQuery(
    {
      location: center,
      productIds:
        selectedProductIds.length > 0 ? selectedProductIds : undefined,
      radius,
    },
    { skip },
  );

  const handleSelect = (storeId: string) => {
    dispatch(setStoreId(storeId));
    dispatch(setShowStore(true));
  };

  // Resolve selected product IDs back to names for the
  // "Results for X, Y" header.
  const selectedProductNames =
    productsData?.allProducts
      .filter((p) => selectedProductIds.includes(p.productId))
      .map((p) => p.name)
      .join(', ') ?? '';

  const stores = data?.storesNear ?? [];

  return (
    <div className={styles['c-search-results']}>
      <h2 className={styles['c-search-results__header']}>
        {t('browse.resultsCount', {
          count: stores.length,
          query: selectedProductNames,
        })}
      </h2>

      {isLoading && stores.length === 0 && (
        <p className={styles['c-search-results__empty']}>
          {t('common.loading')}
        </p>
      )}

      {!isLoading && stores.length === 0 && (
        <p className={styles['c-search-results__empty']}>
          {t('browse.noResults')}
        </p>
      )}

      {stores.length > 0 && (
        <ul className={styles['c-search-results__list']}>
          {stores.map((store) => {
            const isSelected = store.storeId === selectedStoreId;
            return (
              <li
                key={store.storeId}
                className={`${styles['c-search-results__item']} ${
                  isSelected
                    ? styles['c-search-results__item--selected']
                    : ''
                }`}
              >
                <button
                  type="button"
                  className={styles['c-search-results__item-button']}
                  onClick={() => handleSelect(store.storeId)}
                  aria-current={isSelected ? 'true' : undefined}
                >
                  <span className={styles['c-search-results__item-name']}>
                    {store.name}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default SearchResults;
