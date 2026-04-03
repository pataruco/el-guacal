import MapComponent from '../components/map';
import Page from '../components/page';
import ProductFilter from '../components/product-filter';
import SearchBar from '../components/search-bar';
import StoreComponent from '../components/store';
import styles from './index.module.scss';

export default function Home() {
  return (
    <Page className={styles['p-home']} isHome>
      <aside className={styles['p-home__sidebar']}>
        <div className={styles['p-home__controls']}>
          <div className={styles['p-home__search-wrapper']}>
            <SearchBar />
            <ProductFilter />
          </div>
        </div>
      </aside>
      <div className={styles['p-home__map-container']}>
        <MapComponent />
      </div>
      <StoreComponent />
    </Page>
  );
}
