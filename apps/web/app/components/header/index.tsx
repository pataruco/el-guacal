import { Link } from 'react-router';
import { selectAuth } from '@/store/features/auth/slice';
import { useAppSelector } from '@/store/hooks';
import { auth } from '@/utils/firebase';

const Header = () => {
  const { isAuthenticated } = useAppSelector(selectAuth);

  const handleLogout = () => {
    auth.signOut();
  };

  return (
    <header>
      <h1>El Guacal</h1>
      <nav>
        <ul>
          <li>
            <Link to="/">Home</Link>
          </li>
          <li>
            <Link to="/about">About</Link>
          </li>
          {isAuthenticated ? (
            <>
              <li>
                <Link to="/stores/new">Add Store</Link>
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
                  Logout
                </button>
              </li>
            </>
          ) : (
            <li>
              <Link to="/auth">Login</Link>
            </li>
          )}
        </ul>
      </nav>
    </header>
  );
};

export default Header;
