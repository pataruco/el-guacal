import { useTranslation } from 'react-i18next';
import { Link, useParams } from 'react-router';
import type { ContentLocale } from '@/i18n';
import styles from './index.module.scss';

const Footer = () => {
  const { locale } = useParams<{ locale: string }>();
  const { t } = useTranslation();
  const currentLocale = (locale as ContentLocale) || 'en';

  return (
    <footer className={styles['c-footer']}>
      <div className={styles['c-footer__container']}>
        <nav>
          <ul>
            <li>
              <a href="mailto:hola@elguacal.com">{t('footer.email')}</a>
            </li>
            <li>
              <Link to={`/${currentLocale}/privacy-policy`}>
                {t('footer.privacyPolicy')}
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </footer>
  );
};

export default Footer;
