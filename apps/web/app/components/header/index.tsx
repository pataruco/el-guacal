import { Select } from '@base-ui/react/select';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation, useNavigate, useParams } from 'react-router';
import { useFocusTrap } from '@/hooks/use-focus-trap';
import { type ContentLocale, SUPPORTED_LOCALES } from '@/i18n';
import { selectAuth } from '@/store/features/auth/slice';
import { useAppSelector } from '@/store/hooks';
import { auth } from '@/utils/firebase';
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
            {/* Exact Figma logo (node 3:145, "logo placeholder").
                Four stacked saucer paths in a single fill — the top
                path includes the spine cut-out. Fill is the brand
                blue (--color-primary). */}
            <svg
              className={styles['c-header__logo-icon']}
              viewBox="0 0 82 77"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <path
                d="M38.5165 10.0101L16.8085 20.1923L7.25441 15.6471L38.5165 0.61869C40.2369 -0.206229 42.3489 -0.206229 44.0693 0.61869L74.2545 16.0509L64.2227 21L44.0693 10.0101C42.3489 9.18516 40.2369 9.18516 38.5165 10.0101Z"
                fill="var(--color-primary)"
              />
              <path
                d="M38.0942 36.4292L0 18V27.9175L38.0942 46.3467C39.8948 47.2178 42.1054 47.2178 43.9061 46.3467L82 27.9175V18L43.9061 36.4292C42.1054 37.3003 39.8948 37.3003 38.0942 36.4292Z"
                fill="var(--color-primary)"
              />
              <path
                d="M38.0942 51.4292L0 33V42.9175L38.0942 61.3467C39.8948 62.2178 42.1054 62.2178 43.9061 61.3467L82 42.9175V33L43.9061 51.4292C42.1054 52.3003 39.8948 52.3003 38.0942 51.4292Z"
                fill="var(--color-primary)"
              />
              <path
                d="M38.0942 66.4292L0 48V57.9175L38.0942 76.3467C39.8948 77.2178 42.1054 77.2178 43.9061 76.3467L82 57.9175V48L43.9061 66.4292C42.1054 67.3003 39.8948 67.3003 38.0942 66.4292Z"
                fill="var(--color-primary)"
              />
            </svg>
            <h1>El Guacal</h1>
          </Link>
          <nav className={styles['c-header__nav']}>
            <ul className={styles['c-header__nav-list']}>
              {isAuthenticated && (
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
            {isAuthenticated && (
              <Link
                to={`/${currentLocale}/my-store-proposals`}
                onClick={toggleMenu}
                className={styles['c-header__mobile-nav-link']}
              >
                {t('nav.mySubmissions')}
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
