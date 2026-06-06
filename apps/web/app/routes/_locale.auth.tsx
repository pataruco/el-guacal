// Auth page — Stage 2 of the Figma reimplementation (see Figma
// node 77:11414 "sign in / register", subsections "existing
// account" and "new account").
//
// What changed in Stage 2 vs the prior single-page toggle:
//   1. Multi-step flow:
//        email → password (existing user)
//        email → register (new user)
//        email → google-only (account exists only via Google)
//      The previous single-page form with isSignUp toggle is gone.
//      Email-step submission calls `fetchSignInMethodsForEmail` to
//      decide which branch to render. If email enumeration
//      protection is on at the Firebase project level, the call
//      returns [] for every email; we default to register and let
//      `auth/email-already-in-use` from createUser route us back to
//      the password step as a graceful fallback.
//   2. `<main id="main-content">` wraps the page so the root-level
//      skip link in `root.tsx` resolves to a real target. This
//      fixes three pre-existing AAA audit findings at once:
//      bypass-repeated-content, landmark-main, and the region
//      check on the content div.
//   3. Email is shown as small "you entered: …  use different email"
//      text above the password/register steps, with a back-link to
//      reset to the email step.
//
// Stage 1 (auth.module.scss) already added the visual scaffolding —
// new BEM classes used here (`__email-display`, `__back-btn`,
// `__info`) are styled in that file's accompanying update.
import {
  createUserWithEmailAndPassword,
  fetchSignInMethodsForEmail,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  signInWithPopup,
} from 'firebase/auth';
import { type FormEvent, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { type MetaFunction, useNavigate, useParams } from 'react-router';
import i18n from '@/i18n/config';
import { selectAuth } from '@/store/features/auth/slice';
import { useAppSelector } from '@/store/hooks';
import { auth } from '@/utils/firebase';
import { getSeoMeta } from '@/utils/seo';
import styles from './auth.module.scss';

export const meta: MetaFunction = ({ params }) => {
  const locale = params.locale || 'en-GB';
  return getSeoMeta({
    description: i18n.t('seo.auth.login.description', { lng: locale }),
    locale,
    path: `/${locale}/auth`,
    title: i18n.t('seo.auth.login.title', { lng: locale }),
  });
};

type Step = 'email' | 'password' | 'register' | 'google-only';

const AuthPage = () => {
  const { locale } = useParams<{ locale: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { isAuthenticated } = useAppSelector(selectAuth);
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      navigate(`/${locale}`);
    }
  }, [isAuthenticated, navigate, locale]);

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

  const handleEmailContinue = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const methods = await fetchSignInMethodsForEmail(auth, email);
      setLoading(false);
      if (methods.includes('password')) {
        setStep('password');
      } else if (methods.length > 0 && methods.includes('google.com')) {
        setStep('google-only');
      } else {
        // Either truly new, or email enumeration protection hid the
        // methods. Default to register; if it's actually existing,
        // createUserWithEmailAndPassword will throw with
        // auth/email-already-in-use and we re-route to password.
        setStep('register');
      }
    } catch (err) {
      setLoading(false);
      setError(err instanceof Error ? err.message : 'Sign in failed');
    }
  };

  const handlePasswordSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
      setLoading(false);
      setError(err instanceof Error ? err.message : 'Sign in failed');
    }
  };

  const handleRegisterSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await createUserWithEmailAndPassword(auth, email, password);
    } catch (err) {
      setLoading(false);
      // Graceful fallback when email enumeration protection hid the
      // existing account during the email-step check.
      if (
        err instanceof Error &&
        'code' in err &&
        err.code === 'auth/email-already-in-use'
      ) {
        setPassword('');
        setStep('password');
        return;
      }
      setError(err instanceof Error ? err.message : 'Sign up failed');
    }
  };

  const handleChangeEmail = () => {
    setStep('email');
    setPassword('');
    setError(null);
  };

  const title = (() => {
    switch (step) {
      case 'email':
        return t('auth.signInOrCreateTitle');
      case 'password':
        return t('auth.enterPasswordTitle');
      case 'register':
        return t('auth.createAccountTitle');
      case 'google-only':
        return t('auth.signInOrCreateTitle');
    }
  })();

  return (
    <main id="main-content" className={styles['c-auth']}>
      <h1 className={styles['c-auth__title']}>{title}</h1>

      {step === 'email' && (
        <>
          <form
            onSubmit={handleEmailContinue}
            className={styles['c-auth__form']}
          >
            <label className={styles['c-auth__label']} htmlFor="email">
              {t('auth.email')}
            </label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              className={styles['c-auth__input']}
              value={email}
              placeholder={t('auth.emailPlaceholder')}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading}
              className={styles['c-auth__submit-btn']}
            >
              {t('auth.continue')}
            </button>
          </form>

          <div className={styles['c-auth__divider']}>
            <span>{t('auth.or')}</span>
          </div>

          <button
            type="button"
            disabled={loading}
            className={styles['c-auth__provider-btn']}
            onClick={handleGoogleSignIn}
          >
            {t('auth.signInWithGoogle')}
          </button>
        </>
      )}

      {(step === 'password' ||
        step === 'register' ||
        step === 'google-only') && (
        <p className={styles['c-auth__email-display']}>
          {email}
          <button
            type="button"
            className={styles['c-auth__back-btn']}
            onClick={handleChangeEmail}
          >
            {t('auth.useDifferentEmail')}
          </button>
        </p>
      )}

      {step === 'password' && (
        <form
          onSubmit={handlePasswordSubmit}
          className={styles['c-auth__form']}
        >
          <label className={styles['c-auth__label']} htmlFor="password">
            {t('auth.password')}
          </label>
          <input
            id="password"
            type="password"
            required
            minLength={6}
            autoComplete="current-password"
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
            {t('auth.login')}
          </button>
        </form>
      )}

      {step === 'register' && (
        <form
          onSubmit={handleRegisterSubmit}
          className={styles['c-auth__form']}
        >
          <label className={styles['c-auth__label']} htmlFor="password">
            {t('auth.password')}
          </label>
          <input
            id="password"
            type="password"
            required
            minLength={6}
            autoComplete="new-password"
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
            {t('auth.signUp')}
          </button>
        </form>
      )}

      {step === 'google-only' && (
        <>
          <p className={styles['c-auth__info']}>
            {t('auth.emailExistsWithGoogle')}
          </p>
          <button
            type="button"
            disabled={loading}
            className={styles['c-auth__provider-btn']}
            onClick={handleGoogleSignIn}
          >
            {t('auth.signInWithGoogle')}
          </button>
        </>
      )}

      {error && (
        <p className={styles['c-auth__error']} role="alert">
          {error}
        </p>
      )}
    </main>
  );
};

const googleProvider = new GoogleAuthProvider();

export default AuthPage;
