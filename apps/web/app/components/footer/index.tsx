import { useTranslation } from 'react-i18next';

const Footer = () => {
  const { t } = useTranslation();
  return (
    <footer>
      <p>El Guacal</p>
      <p>{t('footer.text')}</p>
    </footer>
  );
};

export default Footer;
