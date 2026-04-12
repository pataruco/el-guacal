import { useTranslation } from 'react-i18next';
import { type MetaFunction, useParams } from 'react-router';
import type { WebSite, WithContext } from 'schema-dts';
import JsonLd from '../components/json-ld';
import MapComponent from '../components/map';
import Page from '../components/page';
import ProductFilter from '../components/product-filter';
import SearchBar from '../components/search-bar';
import StoreComponent from '../components/store';
import i18n from '../i18n/config';
import { getSeoMeta } from '../utils/seo';
import styles from './index.module.scss';

export const meta: MetaFunction = ({ params }) => {
  const locale = params.locale || 'en-GB';
  return getSeoMeta({
    description: i18n.t('seo.home.description', { lng: locale }),
    locale,
    path: `/${locale}`,
    title: i18n.t('seo.home.title', { lng: locale }),
  });
};

export default function Home() {
  const { locale } = useParams<{ locale: string }>();
  const { t } = useTranslation();

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
      <aside className={styles['p-home__sidebar']}>
        <div className={styles['p-home__sidebar__container']}>
          <div className={styles['p-home__controls']}>
            <div className={styles['p-home__search-wrapper']}>
              <SearchBar />
              <ProductFilter />
            </div>
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
