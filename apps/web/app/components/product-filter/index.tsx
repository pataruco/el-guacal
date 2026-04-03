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
        <Popover.Trigger
          className={`o-select__trigger ${styles['c-product-filter__trigger']}`}
        >
          <span>
            {selectedCount > 0
              ? t('search.productsSelected', { count: selectedCount })
              : t('search.filterByProducts')}
          </span>
          <span className="o-select__icon">▼</span>
        </Popover.Trigger>

        <Popover.Portal>
          <Popover.Positioner sideOffset={4} className="o-select__positioner">
            <Popover.Popup className="o-select__popup">
              <fieldset
                className={styles['c-product-filter__list']}
                aria-label={t('search.filterByProducts')}
              >
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
                  <label key={product.productId} className="o-select__item">
                    <input
                      type="checkbox"
                      checked={selectedProductIds.includes(product.productId)}
                      onChange={() => handleToggle(product.productId)}
                      className="o-select__checkbox"
                    />
                    <span className={styles['c-product-filter__item-label']}>
                      {product.name}
                    </span>
                  </label>
                ))}
              </fieldset>
            </Popover.Popup>
          </Popover.Positioner>
        </Popover.Portal>
      </Popover.Root>
    </div>
  );
};

export default ProductFilter;
