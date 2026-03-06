import { useTranslation } from 'react-i18next';
import Page from '../components/page';

export default function About() {
  const { t } = useTranslation();

  return (
    <Page className="about">
      <h1>{t('pages.about.title')}</h1>
      <p>{t('pages.about.body')}</p>
    </Page>
  );
}
