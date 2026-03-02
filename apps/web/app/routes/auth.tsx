import {
  FacebookAuthProvider,
  GithubAuthProvider,
  GoogleAuthProvider,
  OAuthProvider,
  getRedirectResult,
  signInWithRedirect,
  TwitterAuthProvider,
} from 'firebase/auth';
import type { AuthProvider } from 'firebase/auth';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { selectAuth } from '@/store/features/auth/slice';
import { useAppSelector } from '@/store/hooks';
import { auth } from '@/utils/firebase';
import styles from './auth.module.scss';

const AuthPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAppSelector(selectAuth);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const providers = useMemo<
    { name: string; provider: AuthProvider; className: string }[]
  >(
    () => [
      { name: 'Google', provider: new GoogleAuthProvider(), className: styles.google },
      { name: 'Facebook', provider: new FacebookAuthProvider(), className: styles.facebook },
      { name: 'Apple', provider: new OAuthProvider('apple.com'), className: styles.apple },
      { name: 'GitHub', provider: new GithubAuthProvider(), className: styles.github },
      { name: 'Microsoft', provider: new OAuthProvider('microsoft.com'), className: styles.microsoft },
      { name: 'X (Twitter)', provider: new TwitterAuthProvider(), className: styles.twitter },
    ],
    [],
  );

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  // Complete the redirect sign-in flow when returning from a provider
  useEffect(() => {
    getRedirectResult(auth).catch((err) => {
      setError(err instanceof Error ? err.message : 'Sign in failed');
    });
  }, []);

  const handleSignIn = async (provider: AuthProvider) => {
    try {
      setError(null);
      setLoading(true);
      await signInWithRedirect(auth, provider);
    } catch (err) {
      setLoading(false);
      setError(err instanceof Error ? err.message : 'Sign in failed');
    }
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Sign In</h1>
      <div className={styles.providers}>
        {providers.map(({ name, provider, className }) => (
          <button
            key={name}
            type="button"
            disabled={loading}
            className={`${styles.providerBtn} ${className}`}
            onClick={() => handleSignIn(provider)}
          >
            Sign in with {name}
          </button>
        ))}
      </div>
      {error && <p className={styles.error}>{error}</p>}
    </div>
  );
};

export default AuthPage;
