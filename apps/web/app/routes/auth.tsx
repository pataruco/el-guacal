import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  signInWithPopup,
} from 'firebase/auth';
import { type FormEvent, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import { selectAuth } from '@/store/features/auth/slice';
import { useAppSelector } from '@/store/hooks';
import { auth } from '@/utils/firebase';
import styles from './auth.module.scss';

const googleProvider = new GoogleAuthProvider();

const AuthPage = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
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
    <div className={styles['c-auth']}>
      <h1 className={styles['c-auth__title']}>
        {isSignUp ? t('auth.signUp') : t('auth.login')}
      </h1>

      <button
        type="button"
        disabled={loading}
        className={styles['c-auth__provider-btn']}
        onClick={handleGoogleSignIn}
      >
        {t('auth.signInWithGoogle')}
      </button>

      <div className={styles['c-auth__divider']}>
        <span>{t('auth.or')}</span>
      </div>

      <form onSubmit={handleEmailSubmit} className={styles['c-auth__form']}>
        <label className={styles['c-auth__label']} htmlFor="email">
          {t('auth.email')}
        </label>
        <input
          id="email"
          type="email"
          required
          className={styles['c-auth__input']}
          value={email}
          placeholder={t('auth.emailPlaceholder')}
          onChange={(e) => setEmail(e.target.value)}
          disabled={loading}
        />

        <label className={styles['c-auth__label']} htmlFor="password">
          {t('auth.password')}
        </label>
        <input
          id="password"
          type="password"
          required
          minLength={6}
          className={styles['c-auth__input']}
          value={password}
          placeholder={t('auth.passwordPlaceholder')}
          onChange={(e) => setPassword(e.target.value)}
          disabled={loading}
        />

        <button
          type="submit"
          disabled={loading}
          className={styles['c-auth__submit-btn']}
        >
          {isSignUp ? t('auth.signUp') : t('auth.login')}
        </button>
      </form>

      {error && (
        <p className={styles['c-auth__error']} role="alert">
          {error}
        </p>
      )}

      <p className={styles['c-auth__toggle']}>
        {isSignUp ? t('auth.alreadyHaveAccount') : t('auth.dontHaveAccount')}{' '}
        <button
          type="button"
          className={styles['c-auth__toggle-btn']}
          onClick={() => {
            setIsSignUp(!isSignUp);
            setError(null);
          }}
        >
          {isSignUp ? t('auth.login') : t('auth.signUp')}
        </button>
      </p>
    </div>
  );
};

export default AuthPage;
