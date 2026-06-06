import { useTranslation } from 'react-i18next';
import { Link, type MetaFunction } from 'react-router';
import Page from '@/components/page';
import { toContentLocale } from '@/i18n/locale';

export const meta: MetaFunction = () => {
  return [{ title: '404 — El Guacal' }];
};

export default function CatchAll() {
  const { t, i18n } = useTranslation();
  const locale = toContentLocale(i18n.language);

  return (
    <Page className="c-page c-page--prose">
      <h1 className="c-page__title">404</h1>
      <p className="c-page__text">{t('common.notFound')}</p>
      <p className="c-page__text">
        <Link to={`/${locale}`} className="c-page__btn">
          {t('common.backHome')}
        </Link>
      </p>
    </Page>
  );
}
