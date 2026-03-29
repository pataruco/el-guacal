import { useTranslation } from 'react-i18next';
import Page from '../components/page';

export default function About() {
  const { t } = useTranslation();

  return (
    <Page className="c-page">
      <h1 className="c-page__title">{t('pages.about.title')}</h1>
      <p className="c-page__text">{t('pages.about.body')}</p>
    </Page>
  );
}
