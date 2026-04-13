import { Link, useParams } from 'react-router';
import type { ContentLocale } from '@/i18n';
import styles from './index.module.scss';

const Footer = () => {
  const { locale } = useParams<{ locale: string }>();
  const currentLocale = (locale as ContentLocale) || 'en';

  return (
    <footer className={styles['c-footer']}>
      <div className={styles['c-footer__container']}>
        <nav>
          <ul>
            <li>
              <Link to={`/${currentLocale}/privacy-policy`}>
                Privacy policy
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </footer>
  );
};

export default Footer;
