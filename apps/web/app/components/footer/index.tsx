import { useTranslation } from 'react-i18next';
import styles from './index.module.scss';

const Footer = () => {
  const { t } = useTranslation();
  return (
    <footer className={styles['c-footer']}>
      <p className={styles['c-footer__text']}>
        EL GUACAL © {new Date().getFullYear()}
      </p>
      <p className={styles['c-footer__text']}>{t('footer.text')}</p>
    </footer>
  );
};

export default Footer;
