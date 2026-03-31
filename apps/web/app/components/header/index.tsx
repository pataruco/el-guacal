import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation } from 'react-router';
import { ENGLISH, type Language, SPANISH } from '@/locales/i18n';
import { selectAuth } from '@/store/features/auth/slice';
import { useAppSelector } from '@/store/hooks';
import { auth } from '@/utils/firebase';
import styles from './index.module.scss';

const Header = () => {
  const { t, i18n } = useTranslation();
  const { isAuthenticated } = useAppSelector(selectAuth);
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = () => {
    auth.signOut();
    setIsMenuOpen(false);
  };

  const handleLanguageChange = (newLang: Language) => {
    i18n.changeLanguage(newLang);
    localStorage.setItem('i18nextLng', newLang);
  };

  const isActive = (path: string) => location.pathname === path;

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  return (
    <header className={styles['c-header']}>
      <div className={styles['c-header__branding']}>
        <h1>El Guacal</h1>
        <nav className={styles['c-header__nav']}>
          <ul className={styles['c-header__nav-list']}>
            <li className={styles['c-header__nav-item']}>
              <Link
                to="/"
                className={`${styles['c-header__nav-link']} ${isActive('/') ? styles['c-header__nav-link--active'] : ''}`}
                aria-current={isActive('/') ? 'page' : undefined}
                aria-label={t('nav.home')}
              >
                {t('nav.home')}
              </Link>
            </li>
            <li className={styles['c-header__nav-item']}>
              <Link
                to="/about"
                className={`${styles['c-header__nav-link']} ${isActive('/about') ? styles['c-header__nav-link--active'] : ''}`}
                aria-current={isActive('/about') ? 'page' : undefined}
                aria-label={t('nav.about')}
              >
                {t('nav.about')}
              </Link>
            </li>
            <li className={styles['c-header__nav-item']}>
              <Link
                to="/dataset"
                className={`${styles['c-header__nav-link']} ${isActive('/dataset') ? styles['c-header__nav-link--active'] : ''}`}
                aria-current={isActive('/dataset') ? 'page' : undefined}
                aria-label={t('nav.dataset')}
              >
                {t('nav.dataset')}
              </Link>
            </li>
            {isAuthenticated && (
              <li className={styles['c-header__nav-item']}>
                <Link
                  to="/stores/new"
                  className={`${styles['c-header__nav-link']} ${isActive('/stores/new') ? styles['c-header__nav-link--active'] : ''}`}
                  aria-current={isActive('/stores/new') ? 'page' : undefined}
                  aria-label={t('nav.addStore')}
                >
                  {t('nav.addStore')}
                </Link>
              </li>
            )}
          </ul>
        </nav>
      </div>

      <button
        type="button"
        aria-label="Close menu"
        className={`${styles['c-header__mobile-overlay']} ${isMenuOpen ? styles['c-header__mobile-overlay--open'] : ''}`}
        onClick={toggleMenu}
      />
      <div
        className={`${styles['c-header__mobile-menu']} ${isMenuOpen ? styles['c-header__mobile-menu--open'] : ''}`}
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
          <Link
            to="/"
            onClick={toggleMenu}
            className={styles['c-header__mobile-nav-link']}
          >
            {t('nav.home')}
          </Link>
          <Link
            to="/about"
            onClick={toggleMenu}
            className={styles['c-header__mobile-nav-link']}
          >
            {t('nav.about')}
          </Link>
          <Link
            to="/dataset"
            onClick={toggleMenu}
            className={styles['c-header__mobile-nav-link']}
          >
            {t('nav.dataset')}
          </Link>
          {isAuthenticated && (
            <Link
              to="/stores/new"
              onClick={toggleMenu}
              className={styles['c-header__mobile-nav-link']}
            >
              {t('nav.addStore')}
            </Link>
          )}
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
              to="/auth"
              onClick={toggleMenu}
              className={styles['c-header__mobile-nav-link']}
            >
              {t('nav.login')}
            </Link>
          )}
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
        <div className={styles['c-header__lang-toggle']}>
          <button
            type="button"
            onClick={() => handleLanguageChange(ENGLISH)}
            className={`${styles['c-header__lang-toggle-btn']} ${i18n.language === ENGLISH ? styles['c-header__lang-toggle-btn--active'] : ''}`}
          >
            EN
          </button>
          <button
            type="button"
            onClick={() => handleLanguageChange(SPANISH)}
            className={`${styles['c-header__lang-toggle-btn']} ${i18n.language === SPANISH ? styles['c-header__lang-toggle-btn--active'] : ''}`}
          >
            ES
          </button>
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
          <Link to="/auth" className={styles['c-header__auth-link']}>
            {t('nav.login')}
          </Link>
        )}
      </div>
    </header>
  );
};

export default Header;
