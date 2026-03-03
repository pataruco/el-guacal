import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  signInWithPopup,
} from 'firebase/auth';
import { type FormEvent, useEffect, useState } from 'react';
// eslint-disable-next-line deprecation/deprecation
import { useNavigate } from 'react-router';
import { selectAuth } from '@/store/features/auth/slice';
import { useAppSelector } from '@/store/hooks';
import { auth } from '@/utils/firebase';
import styles from './auth.module.scss';

const googleProvider = new GoogleAuthProvider();

const AuthPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAppSelector(selectAuth);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  const handleGoogleSignIn = async () => {
    try {
      setError(null);
      setLoading(true);
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      setLoading(false);
      setError(err instanceof Error ? err.message : 'Sign in failed');
    }
  };

  const handleEmailSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      setError(null);
      setLoading(true);
      if (isSignUp) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (err) {
      setLoading(false);
      setError(err instanceof Error ? err.message : 'Sign in failed');
    }
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>{isSignUp ? 'Sign Up' : 'Sign In'}</h1>

      <button
        type="button"
        disabled={loading}
        className={`${styles.providerBtn} ${styles.google}`}
        onClick={handleGoogleSignIn}
      >
        Sign in with Google
      </button>

      <div className={styles.divider}>
        <span>or</span>
      </div>

      <form onSubmit={handleEmailSubmit} className={styles.form}>
        <label className={styles.label} htmlFor="email">
          Email
        </label>
        <input
          id="email"
          type="email"
          required
          className={styles.input}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={loading}
        />

        <label className={styles.label} htmlFor="password">
          Password
        </label>
        <input
          id="password"
          type="password"
          required
          minLength={6}
          className={styles.input}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={loading}
        />

        <button type="submit" disabled={loading} className={styles.submitBtn}>
          {isSignUp ? 'Create Account' : 'Sign In'}
        </button>
      </form>

      {error && <p className={styles.error}>{error}</p>}

      <p className={styles.toggle}>
        {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
        <button
          type="button"
          className={styles.toggleBtn}
          onClick={() => {
            setIsSignUp(!isSignUp);
            setError(null);
          }}
        >
          {isSignUp ? 'Sign In' : 'Sign Up'}
        </button>
      </p>
    </div>
  );
};

export default AuthPage;
