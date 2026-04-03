import { Select } from '@base-ui/react/select';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation, useNavigate, useParams } from 'react-router';
import { type ContentLocale, SUPPORTED_LOCALES } from '@/i18n';
import { selectAuth } from '@/store/features/auth/slice';
import { useAppSelector } from '@/store/hooks';
import { auth } from '@/utils/firebase';
import { useFocusTrap } from '@/utils/use-focus-trap';
import styles from './index.module.scss';

const languageLabels: Record<ContentLocale, string> = {
  en: 'English',
  es: 'Español',
};

const LanguageSelector = () => {
  const { t } = useTranslation();
  const { locale } = useParams<{ locale: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const currentLocale = (locale as ContentLocale) || 'en';

  const handleLanguageChange = (newLocale: ContentLocale | null) => {
    if (!newLocale) return;
    const newPath = location.pathname.replace(/^\/(en|es)/, `/${newLocale}`);
    navigate(newPath);
  };

  return (
    <Select.Root value={currentLocale} onValueChange={handleLanguageChange}>
      <Select.Trigger
        className="o-select__trigger"
        aria-label={t('nav.languageSelector')}
      >
        <Select.Value>{languageLabels[currentLocale]}</Select.Value>
        <Select.Icon className="o-select__icon">▼</Select.Icon>
      </Select.Trigger>
      <Select.Portal>
        <Select.Positioner sideOffset={8} className="o-select__positioner">
          <Select.Popup className="o-select__popup">
            {SUPPORTED_LOCALES.map((loc) => (
              <Select.Item key={loc} value={loc} className="o-select__item">
                {languageLabels[loc]}
              </Select.Item>
            ))}
          </Select.Popup>
        </Select.Positioner>
      </Select.Portal>
    </Select.Root>
  );
};

const Header = () => {
  const { t } = useTranslation();
  const { isAuthenticated } = useAppSelector(selectAuth);
  const location = useLocation();
  const { locale } = useParams<{ locale: string }>();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  useFocusTrap(mobileMenuRef, isMenuOpen);

  const currentLocale = (locale as ContentLocale) || 'en';

  const handleLogout = () => {
    auth.signOut();
    setIsMenuOpen(false);
  };

  const isActive = (path: string) => location.pathname === path;

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  return (
    <header className={styles['c-header']}>
      <div className={styles['c-header__branding']}>
        <Link to={`/${currentLocale}`} className={styles['c-header__logo']}>
          <h1>El Guacal</h1>
        </Link>
        <nav className={styles['c-header__nav']}>
          <ul className={styles['c-header__nav-list']}>
            {isAuthenticated && (
              <li className={styles['c-header__nav-item']}>
                <Link
                  to={`/${currentLocale}/stores/new`}
                  className={`${styles['c-header__nav-link']} ${isActive(`/${currentLocale}/stores/new`) ? styles['c-header__nav-link--active'] : ''}`}
                  aria-current={
                    isActive(`/${currentLocale}/stores/new`)
                      ? 'page'
                      : undefined
                  }
                  aria-label={t('nav.addStore')}
                >
                  {t('nav.addStore')}
                </Link>
              </li>
            )}
            <li className={styles['c-header__nav-item']}>
              <Link
                to={`/${currentLocale}/dataset`}
                className={`${styles['c-header__nav-link']} ${isActive(`/${currentLocale}/dataset`) ? styles['c-header__nav-link--active'] : ''}`}
                aria-current={
                  isActive(`/${currentLocale}/dataset`) ? 'page' : undefined
                }
                aria-label={t('nav.dataset')}
              >
                {t('nav.dataset')}
              </Link>
            </li>
            <li className={styles['c-header__nav-item']}>
              <Link
                to={`/${currentLocale}/blog`}
                className={`${styles['c-header__nav-link']} ${location.pathname.startsWith(`/${currentLocale}/blog`) ? styles['c-header__nav-link--active'] : ''}`}
                aria-current={
                  location.pathname.startsWith(`/${currentLocale}/blog`)
                    ? 'page'
                    : undefined
                }
                aria-label={t('nav.blog')}
              >
                {t('nav.blog')}
              </Link>
            </li>
            <li className={styles['c-header__nav-item']}>
              <Link
                to={`/${currentLocale}/about`}
                className={`${styles['c-header__nav-link']} ${isActive(`/${currentLocale}/about`) ? styles['c-header__nav-link--active'] : ''}`}
                aria-current={
                  isActive(`/${currentLocale}/about`) ? 'page' : undefined
                }
                aria-label={t('nav.about')}
              >
                {t('nav.about')}
              </Link>
            </li>
          </ul>
        </nav>
      </div>

      <button
        type="button"
        aria-label={t('nav.close')}
        className={`${styles['c-header__mobile-overlay']} ${isMenuOpen ? styles['c-header__mobile-overlay--open'] : ''}`}
        onClick={toggleMenu}
      />
      <div
        ref={mobileMenuRef}
        className={`${styles['c-header__mobile-menu']} ${isMenuOpen ? styles['c-header__mobile-menu--open'] : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label={t('nav.menu')}
        aria-hidden={!isMenuOpen}
      >
        <div className={styles['c-header__mobile-menu-header']}>
          <button
            type="button"
            className={styles['c-header__mobile-menu-close']}
            onClick={toggleMenu}
            aria-label={t('nav.close')}
          >
            {t('nav.close')}
          </button>
        </div>
        <nav className={styles['c-header__mobile-nav']}>
          {isAuthenticated && (
            <Link
              to={`/${currentLocale}/stores/new`}
              onClick={toggleMenu}
              className={styles['c-header__mobile-nav-link']}
            >
              {t('nav.addStore')}
            </Link>
          )}
          <Link
            to={`/${currentLocale}/dataset`}
            onClick={toggleMenu}
            className={styles['c-header__mobile-nav-link']}
          >
            {t('nav.dataset')}
          </Link>
          <Link
            to={`/${currentLocale}/blog`}
            onClick={toggleMenu}
            className={styles['c-header__mobile-nav-link']}
          >
            {t('nav.blog')}
          </Link>
          <Link
            to={`/${currentLocale}/about`}
            onClick={toggleMenu}
            className={styles['c-header__mobile-nav-link']}
          >
            {t('nav.about')}
          </Link>
          <hr className={styles['c-header__mobile-menu-divider']} />
          {isAuthenticated ? (
            <button
              type="button"
              onClick={handleLogout}
              className={styles['c-header__mobile-nav-link']}
            >
              {t('nav.logout')}
            </button>
          ) : (
            <Link
              to={`/${currentLocale}/auth`}
              onClick={toggleMenu}
              className={styles['c-header__mobile-nav-link']}
            >
              {t('nav.login')}
            </Link>
          )}
          <hr className={styles['c-header__mobile-menu-divider']} />
          <div className={styles['c-header__mobile-lang-selector']}>
            <LanguageSelector />
          </div>
        </nav>
      </div>

      <div className={styles['c-header__actions']}>
        <button
          type="button"
          className={styles['c-header__hamburger']}
          onClick={toggleMenu}
          aria-label={t('nav.menu')}
        >
          {t('nav.menu')}
        </button>
        <div className={styles['c-header__lang-selector']}>
          <LanguageSelector />
        </div>

        {isAuthenticated ? (
          <button
            type="button"
            onClick={handleLogout}
            className={styles['c-header__logout-btn']}
          >
            {t('nav.logout')}
          </button>
        ) : (
          <Link
            to={`/${currentLocale}/auth`}
            className={styles['c-header__auth-link']}
          >
            {t('nav.login')}
          </Link>
        )}
      </div>
    </header>
  );
};

export default Header;
