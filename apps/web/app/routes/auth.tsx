import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  signInWithPopup,
} from 'firebase/auth';
import { type FormEvent, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
// eslint-disable-next-line deprecation/deprecation
import { useNavigate, useParams } from 'react-router';
import { selectAuth } from '@/store/features/auth/slice';
import { supportedLngs } from '../i18n';
import { useAppSelector } from '@/store/hooks';
import { auth } from '@/utils/firebase';
import styles from './auth.module.scss';

const googleProvider = new GoogleAuthProvider();

const AuthPage = () => {
  const { lang } = useParams();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { isAuthenticated } = useAppSelector(selectAuth);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    if (!lang) {
      const detectedLng = localStorage.getItem('i18nextLng') || i18n.language || 'en-GB';
      const targetLng = supportedLngs.includes(detectedLng) ? detectedLng : 'en-GB';
      navigate(`/${targetLng}/auth`, { replace: true });
    }
  }, [lang, i18n.language, navigate]);

  useEffect(() => {
    if (isAuthenticated) {
      navigate(lang ? `/${lang}` : '/');
    }
  }, [isAuthenticated, navigate, lang]);

  if (!lang) {
    return null;
  }

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
      <h1 className={styles.title}>
        {isSignUp ? t('auth.signUp') : t('auth.login')}
      </h1>

      <button
        type="button"
        disabled={loading}
        className={`${styles.providerBtn} ${styles.google}`}
        onClick={handleGoogleSignIn}
      >
        {t('auth.signInWithGoogle')}
      </button>

      <div className={styles.divider}>
        <span>{t('auth.or')}</span>
      </div>

      <form onSubmit={handleEmailSubmit} className={styles.form}>
        <label className={styles.label} htmlFor="email">
          {t('auth.email')}
        </label>
        <input
          id="email"
          type="email"
          required
          className={styles.input}
          value={email}
          placeholder={t('auth.emailPlaceholder')}
          onChange={(e) => setEmail(e.target.value)}
          disabled={loading}
        />

        <label className={styles.label} htmlFor="password">
          {t('auth.password')}
        </label>
        <input
          id="password"
          type="password"
          required
          minLength={6}
          className={styles.input}
          value={password}
          placeholder={t('auth.passwordPlaceholder')}
          onChange={(e) => setPassword(e.target.value)}
          disabled={loading}
        />

        <button type="submit" disabled={loading} className={styles.submitBtn}>
          {isSignUp ? t('auth.signUp') : t('auth.login')}
        </button>
      </form>

      {error && <p className={styles.error}>{error}</p>}

      <p className={styles.toggle}>
        {isSignUp ? t('auth.alreadyHaveAccount') : t('auth.dontHaveAccount')}{' '}
        <button
          type="button"
          className={styles.toggleBtn}
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
