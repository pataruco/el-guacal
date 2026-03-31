import FilterButton from '../components/filter-button';
import LocateMeButton from '../components/locate-me-button';
import MapComponent from '../components/map';
import Page from '../components/page';
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
            <FilterButton />
          </div>
        </div>
      </aside>
      <div className={styles['p-home__map-container']}>
        <MapComponent />
        <LocateMeButton />
      </div>
      <StoreComponent />
    </Page>
  );
}
