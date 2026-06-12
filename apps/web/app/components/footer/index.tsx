import { useTranslation } from 'react-i18next';
import { Link, useParams } from 'react-router';
import type { ContentLocale } from '@/i18n';
import styles from './index.module.scss';

const REPO_URL = 'https://github.com/pataruco/el-guacal';

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
        <div className={styles['c-footer__versions']}>
          <a
            href={`${REPO_URL}/releases/tag/server-v${__API_VERSION__}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            API {__API_VERSION__}
          </a>
          <span aria-hidden="true">|</span>
          <a
            href={`${REPO_URL}/releases/tag/web-v${__WEB_VERSION__}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            Web {__WEB_VERSION__}
          </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
