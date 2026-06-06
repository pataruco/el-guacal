import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { type MetaFunction, useParams, useSearchParams } from 'react-router';
import type { WebSite, WithContext } from 'schema-dts';
import JsonLd from '../components/json-ld';
import MapComponent from '../components/map';
import Page from '../components/page';
import ProductFilter from '../components/product-filter';
import SearchBar from '../components/search-bar';
import SearchResults from '../components/search-results';
import StoreComponent from '../components/store';
import i18n from '../i18n/config';
import { resolveMetaLocale } from '../i18n/locale';
import { selectMap, setSelectedProductIds } from '../store/features/map/slice';
import { selectStoreState } from '../store/features/stores/slice';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { getSeoMeta } from '../utils/seo';
import styles from './index.module.scss';

export const meta: MetaFunction = ({ params }) => {
  const { contentLocale, i18nLng } = resolveMetaLocale(params.locale);
  return getSeoMeta({
    description: i18n.t('seo.home.description', { lng: i18nLng }),
    locale: i18nLng,
    path: `/${contentLocale}`,
    title: i18n.t('seo.home.title', { lng: i18nLng }),
  });
};

export default function Home() {
  const { locale } = useParams<{ locale: string }>();
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const [searchParams, setSearchParams] = useSearchParams();
  const { show: isStoreShown } = useAppSelector(selectStoreState);
  const { selectedProductIds } = useAppSelector(selectMap);
  const hasActiveSearch = selectedProductIds.length > 0;

  // URL ↔ Redux sync for the product filter (Stage E of search
  // locations). On mount, restore selectedProductIds from
  // `?products=id1,id2`. On change, update the URL without
  // re-navigating so the back button still works. Shareable
  // search-result URLs come for free.
  const hasHydratedFromUrl = useRef(false);
  useEffect(() => {
    if (hasHydratedFromUrl.current) return;
    hasHydratedFromUrl.current = true;
    const urlProducts = searchParams.get('products');
    if (urlProducts) {
      const ids = urlProducts.split(',').filter(Boolean);
      if (ids.length > 0) {
        dispatch(setSelectedProductIds(ids));
      }
    }
  }, [dispatch, searchParams]);

  useEffect(() => {
    if (!hasHydratedFromUrl.current) return;
    const next = new URLSearchParams(searchParams);
    if (selectedProductIds.length > 0) {
      next.set('products', selectedProductIds.join(','));
    } else {
      next.delete('products');
    }
    if (next.toString() !== searchParams.toString()) {
      setSearchParams(next, { replace: true });
    }
  }, [selectedProductIds, searchParams, setSearchParams]);

  const jsonLd: WithContext<WebSite> = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    description: t('seo.home.description'),
    inLanguage: locale,
    name: 'El Guacal',
    potentialAction: {
      '@type': 'SearchAction',
      'query-input': 'required name=search_term_string',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `https://elguacal.com/${locale}?q={search_term_string}`,
      },
    },
    url: 'https://elguacal.com',
  };

  return (
    <Page className={styles['p-home']} isHome>
      <JsonLd data={jsonLd} />
      {/* Left overlay zone — three exclusive states:
            1. Store selected → StoreComponent renders its own card
               (handled by isStoreShown check; we hide the sidebar
               entirely so its rule wins).
            2. Active search (products filtered) → SearchResults
               list (Figma section 77:11036).
            3. Idle/resting → Favourites card with search + filter
               + hero placeholder (Figma node 88:3545). */}
      {!isStoreShown && (
        <aside className={styles['p-home__sidebar']}>
          <div className={styles['p-home__sidebar__container']}>
            {hasActiveSearch ? (
              <>
                <div className={styles['p-home__search-controls']}>
                  <SearchBar />
                  <ProductFilter />
                </div>
                <SearchResults />
              </>
            ) : (
              <div className={styles['p-home__favourites-card']}>
                <h2 className={styles['p-home__favourites-title']}>
                  {t('browse.findStoreTitle')}
                </h2>
                {/* SearchBar lives here, not in the header —
                    follows the toiletmap.org.uk floating-card
                    layout pattern where all search/filter UI
                    consolidates into a single overlay widget on
                    the left. */}
                <SearchBar />
                <ProductFilter />
              </div>
            )}
          </div>
        </aside>
      )}
      <div className={styles['p-home__map-container']}>
        <MapComponent />
      </div>
      <StoreComponent />
    </Page>
  );
}
