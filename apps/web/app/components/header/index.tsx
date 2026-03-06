import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { ENGLISH, type Language, SPANISH } from '@/locales/i18n';
import { selectAuth } from '@/store/features/auth/slice';
import { useAppSelector } from '@/store/hooks';
import { auth } from '@/utils/firebase';

const Header = () => {
  const { t, i18n } = useTranslation();
  const { isAuthenticated } = useAppSelector(selectAuth);

  const handleLogout = () => {
    auth.signOut();
  };

  const handleLanguageChange = (newLang: Language) => {
    i18n.changeLanguage(newLang);
    localStorage.setItem('i18nextLng', newLang);
  };

  return (
    <header>
      <h1>El Guacal</h1>
      <nav>
        <div style={{ marginBottom: '1rem' }}>
          <button
            type="button"
            onClick={() => handleLanguageChange(ENGLISH)}
            style={{
              fontWeight: i18n.language === ENGLISH ? 'bold' : 'normal',
              marginRight: '0.5rem',
            }}
          >
            EN
          </button>
          <button
            type="button"
            onClick={() => handleLanguageChange(SPANISH)}
            style={{
              fontWeight: i18n.language === SPANISH ? 'bold' : 'normal',
            }}
          >
            ES
          </button>
        </div>
        <ul>
          <li>
            <Link to="/">{t('nav.home')}</Link>
          </li>
          <li>
            <Link to="/about">{t('nav.about')}</Link>
          </li>
          <li>
            <Link to="/dataset">{t('nav.dataset')}</Link>
          </li>
          {isAuthenticated ? (
            <>
              <li>
                <Link to="/stores/new">{t('nav.addStore')}</Link>
              </li>
              <li>
                <button type="button" onClick={handleLogout}>
                  {t('nav.logout')}
                </button>
              </li>
            </>
          ) : (
            <li>
              <Link to="/auth">{t('nav.login')}</Link>
            </li>
          )}
        </ul>
      </nav>
    </header>
  );
};

export default Header;
