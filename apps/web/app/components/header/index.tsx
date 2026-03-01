import { signOut } from 'firebase/auth';
import { Link } from 'react-router';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { auth } from '../../utils/firebase';
import { setIsCreating, setShowStore } from '@/store/features/stores/slice';

const Header = () => {
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Error signing out', error);
    }
  };

  const handleCreateStore = () => {
    dispatch(setIsCreating(true));
    dispatch(setShowStore(true));
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
          {user ? (
            <>
              <li>
                <button type="button" onClick={handleCreateStore}>
                  Create Store
                </button>
              </li>
              <li>
                <span>Welcome, {user.displayName || user.email}</span>
              </li>
              <li>
                <button type="button" onClick={handleLogout}>
                  Logout
                </button>
              </li>
            </>
          ) : (
            <li>
              <Link to="/auth/login">Login</Link>
            </li>
          )}
        </ul>
      </nav>
    </header>
  );
};

export default Header;
