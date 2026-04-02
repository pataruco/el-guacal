import { Popover } from '@base-ui/react/popover';
import { useTranslation } from 'react-i18next';
import { useAllProductsQuery } from '@/graphql/queries/all-products/index.generated';
import { selectMap, toggleProductId } from '@/store/features/map/slice';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import styles from './index.module.scss';

const ProductFilter = () => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const { selectedProductIds } = useAppSelector(selectMap);
  const { data: productsData, isLoading } = useAllProductsQuery();

  const handleToggle = (productId: string) => {
    dispatch(toggleProductId(productId));
  };

  const selectedCount = selectedProductIds.length;

  return (
    <div className={styles['c-product-filter']}>
      <Popover.Root>
        <Popover.Trigger className={styles['c-product-filter__trigger']}>
          <span>
            {selectedCount > 0
              ? t('search.productsSelected', { count: selectedCount })
              : t('search.filterByProducts')}
          </span>
          <span className={styles['c-product-filter__trigger-icon']}>▼</span>
        </Popover.Trigger>

        <Popover.Portal>
          <Popover.Positioner
            sideOffset={4}
            className={styles['c-product-filter__positioner']}
          >
            <Popover.Popup className={styles['c-product-filter__popup']}>
              <div className={styles['c-product-filter__list']}>
                {isLoading && (
                  <div className={styles['c-product-filter__empty']}>
                    {t('storeForm.searchProducts')}
                  </div>
                )}
                {!isLoading && productsData?.allProducts.length === 0 && (
                  <div className={styles['c-product-filter__empty']}>
                    {t('storeForm.noProductsFound')}
                  </div>
                )}
                {productsData?.allProducts.map((product) => (
                  <button
                    key={product.productId}
                    className={styles['c-product-filter__item']}
                    onClick={() => handleToggle(product.productId)}
                    type="button"
                  >
                    <div
                      className={styles['c-product-filter__checkbox']}
                      data-state={
                        selectedProductIds.includes(product.productId)
                          ? 'checked'
                          : 'unchecked'
                      }
                    />
                    <span className={styles['c-product-filter__item-label']}>
                      {product.name}
                    </span>
                  </button>
                ))}
              </div>
            </Popover.Popup>
          </Popover.Positioner>
        </Popover.Portal>
      </Popover.Root>
    </div>
  );
};

export default ProductFilter;
