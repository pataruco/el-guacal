import { Select } from '@base-ui/react/select';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation, useNavigate, useParams } from 'react-router';
import { useFocusTrap } from '@/hooks/use-focus-trap';
import { type ContentLocale, SUPPORTED_LOCALES } from '@/i18n';
import { selectAuth } from '@/store/features/auth/slice';
import { useAppSelector } from '@/store/hooks';
import { auth } from '@/utils/firebase';
import SearchBar from '../search-bar';
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

  // aria-label includes the visible language name so the
  // accessible name contains "English" / "Español". WCAG 2.5.3
  // ("Label in Name") requires this — a voice-control user
  // saying "click English" needs the trigger to be addressable
  // by its visible text.
  return (
    <Select.Root value={currentLocale} onValueChange={handleLanguageChange}>
      <Select.Trigger
        className="o-select__trigger"
        aria-label={`${t('nav.languageSelector')}: ${languageLabels[currentLocale]}`}
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
      <div className={styles['c-header__container']}>
        <div className={styles['c-header__branding']}>
          <Link to={`/${currentLocale}`} className={styles['c-header__logo']}>
            {/* Approximation of the Figma logo (node 3:145) — three
                stacked hexagonal layers in the blue scale. Replace
                with the exported Figma asset once available. */}
            <svg
              className={styles['c-header__logo-icon']}
              viewBox="0 0 40 30"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <path
                d="M2 6 L8 12 L32 12 L38 6 L32 0 L8 0 Z"
                fill="var(--color-blue-400)"
              />
              <path
                d="M2 15 L8 21 L32 21 L38 15 L32 9 L8 9 Z"
                fill="var(--color-blue-700)"
              />
              <path
                d="M2 24 L8 30 L32 30 L38 24 L32 18 L8 18 Z"
                fill="var(--color-blue-900)"
              />
            </svg>
            <h1>El Guacal</h1>
          </Link>
          <nav className={styles['c-header__nav']}>
            <ul className={styles['c-header__nav-list']}>
              {isAuthenticated && (
                <>
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
                  <li className={styles['c-header__nav-item']}>
                    <Link
                      to={`/${currentLocale}/my-store-proposals`}
                      className={`${styles['c-header__nav-link']} ${isActive(`/${currentLocale}/my-store-proposals`) ? styles['c-header__nav-link--active'] : ''}`}
                      aria-current={
                        isActive(`/${currentLocale}/my-store-proposals`)
                          ? 'page'
                          : undefined
                      }
                      aria-label={t('nav.mySubmissions')}
                    >
                      {t('nav.mySubmissions')}
                    </Link>
                  </li>
                </>
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
          // `inert` (React 19+ native prop) removes the entire
          // subtree from the tab order AND from the accessibility
          // tree when the menu is closed. Replaces the previous
          // `aria-hidden={!isMenuOpen}`, which left focusable
          // children tabbable — accesslint flagged 6 violations
          // against that pattern.
          //
          // aria-hidden is INTENTIONALLY dropped. Doubling up with
          // inert sounds defensive but axe-core's aria-hidden-focus
          // rule fires on the aria-hidden side regardless of inert,
          // so the audit stays red. Inert is baseline-supported in
          // all modern browsers + screen readers (NVDA, JAWS,
          // VoiceOver) since 2023.
          inert={!isMenuOpen}
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
            <div className={styles['c-header__mobile-search']}>
              <SearchBar />
            </div>
            <hr className={styles['c-header__mobile-menu-divider']} />
            {isAuthenticated && (
              <>
                <Link
                  to={`/${currentLocale}/stores/new`}
                  onClick={toggleMenu}
                  className={styles['c-header__mobile-nav-link']}
                >
                  {t('nav.addStore')}
                </Link>
                <Link
                  to={`/${currentLocale}/my-store-proposals`}
                  onClick={toggleMenu}
                  className={styles['c-header__mobile-nav-link']}
                >
                  {t('nav.mySubmissions')}
                </Link>
              </>
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

        <div className={styles['c-header__search']}>
          <SearchBar />
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
          <Link
            to={`/${currentLocale}/stores/new`}
            className={styles['c-header__add-location']}
          >
            {t('nav.addLocation')}
          </Link>
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
      </div>
    </header>
  );
};

export default Header;
