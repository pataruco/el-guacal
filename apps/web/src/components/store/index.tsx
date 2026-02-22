import { useGetStoreByIdQuery } from '@/graphql/queries/get-store-by-id/indes.generated';
import { selectStoreState, setShowStore } from '@/store/features/stores/slice';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { formatDate } from '@/utils/date-utils';
import styles from './index.module.scss';

const Store: React.FC = () => {
  const dispatch = useAppDispatch();

  const { storeId, show } = useAppSelector(selectStoreState);

  const handleOnClose = () => {
    dispatch(setShowStore(false));
  };

  const { data, isLoading, isError } = useGetStoreByIdQuery({ storeId });

  console.log(data);

  if (!show || isError || isLoading || !data) return null;

  const store = data.getStoreById;

  if (!store) return null;

  const { name, address, products, updatedAt, location } = store;

  console.log({ products });

  return (
    <section className={styles.store}>
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
