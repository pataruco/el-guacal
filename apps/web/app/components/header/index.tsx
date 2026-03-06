import { useTranslation } from 'react-i18next';
import { Link, useLocation, useNavigate, useParams } from 'react-router';
import { selectAuth } from '@/store/features/auth/slice';
import { useAppSelector } from '@/store/hooks';
import { auth } from '@/utils/firebase';

const Header = () => {
  const { lang } = useParams();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useAppSelector(selectAuth);

  const handleLogout = () => {
    auth.signOut();
  };

  const handleLanguageChange = (newLang: string) => {
    const currentPath = location.pathname;
    const pathSegments = currentPath.split('/').filter(Boolean);

    // If the first segment is a supported locale, replace it
    if (pathSegments.length > 0 && ['en-GB', 'es-VE'].includes(pathSegments[0])) {
      pathSegments[0] = newLang;
    } else {
      // Otherwise, prepend the new locale
      pathSegments.unshift(newLang);
    }

    const newPath = `/${pathSegments.join('/')}`;
    i18n.changeLanguage(newLang);
    localStorage.setItem('i18nextLng', newLang);
    navigate(newPath);
  };

  return (
    <header>
      <h1>El Guacal</h1>
      <nav>
        <div style={{ marginBottom: '1rem' }}>
          <button
            type="button"
            onClick={() => handleLanguageChange('en-GB')}
            style={{
              fontWeight: lang === 'en-GB' ? 'bold' : 'normal',
              marginRight: '0.5rem',
            }}
          >
            EN
          </button>
          <button
            type="button"
            onClick={() => handleLanguageChange('es-VE')}
            style={{
              fontWeight: lang === 'es-VE' ? 'bold' : 'normal',
            }}
          >
            ES
          </button>
        </div>
        <ul>
          <li>
            <Link to={`/${lang || 'en-GB'}`}>{t('nav.home')}</Link>
          </li>
          <li>
            <Link to={`/${lang || 'en-GB'}/about`}>{t('nav.about')}</Link>
          </li>
          <li>
            <Link to={`/${lang || 'en-GB'}/dataset`}>{t('nav.dataset')}</Link>
          </li>
          {isAuthenticated ? (
            <>
              <li>
                <Link to={`/${lang || 'en-GB'}/stores/new`}>
                  {t('nav.addStore')}
                </Link>
              </li>
              <li>
                <button
                  type="button"
                  onClick={handleLogout}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'blue',
                    cursor: 'pointer',
                    padding: 0,
                    textDecoration: 'underline',
                  }}
                >
                  {t('nav.logout')}
                </button>
              </li>
            </>
          ) : (
            <li>
              <Link to={`/${lang || 'en-GB'}/auth`}>{t('nav.login')}</Link>
            </li>
          )}
        </ul>
      </nav>
    </header>
  );
};

export default Header;
