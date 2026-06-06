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
import { resolveMetaLocale } from '@/i18n/locale';
import { selectAuth } from '@/store/features/auth/slice';
import { useAppSelector } from '@/store/hooks';
import { auth } from '@/utils/firebase';
import { getSeoMeta } from '@/utils/seo';
import styles from './auth.module.scss';

export const meta: MetaFunction = ({ params }) => {
  const { contentLocale, i18nLng } = resolveMetaLocale(params.locale);
  return getSeoMeta({
    description: i18n.t('seo.auth.login.description', { lng: i18nLng }),
    imageAlt: i18n.t('seo.imageAlt', { lng: i18nLng }),
    locale: i18nLng,
    path: `/${contentLocale}/auth`,
    title: i18n.t('seo.auth.login.title', { lng: i18nLng }),
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
      {/* Right-side brand hero — logo + "El Guacal" wordmark on
          a blue surface. Replaces the prior gradient placeholder.
          Sits visually beside the form on desktop; hidden on
          mobile (same breakpoint as the existing pseudo-element
          behaviour). */}
      <aside className={styles['c-auth__hero']} aria-hidden="true">
        <svg
          className={styles['c-auth__hero-icon']}
          viewBox="0 0 82 77"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <title>{t('auth.createAccountTitle')}</title>
          <path
            d="M38.5165 10.0101L16.8085 20.1923L7.25441 15.6471L38.5165 0.61869C40.2369 -0.206229 42.3489 -0.206229 44.0693 0.61869L74.2545 16.0509L64.2227 21L44.0693 10.0101C42.3489 9.18516 40.2369 9.18516 38.5165 10.0101Z"
            fill="currentColor"
          />
          <path
            d="M38.0942 36.4292L0 18V27.9175L38.0942 46.3467C39.8948 47.2178 42.1054 47.2178 43.9061 46.3467L82 27.9175V18L43.9061 36.4292C42.1054 37.3003 39.8948 37.3003 38.0942 36.4292Z"
            fill="currentColor"
          />
          <path
            d="M38.0942 51.4292L0 33V42.9175L38.0942 61.3467C39.8948 62.2178 42.1054 62.2178 43.9061 61.3467L82 42.9175V33L43.9061 51.4292C42.1054 52.3003 39.8948 52.3003 38.0942 51.4292Z"
            fill="currentColor"
          />
          <path
            d="M38.0942 66.4292L0 48V57.9175L38.0942 76.3467C39.8948 77.2178 42.1054 77.2178 43.9061 76.3467L82 57.9175V48L43.9061 66.4292C42.1054 67.3003 39.8948 67.3003 38.0942 66.4292Z"
            fill="currentColor"
          />
        </svg>
        <p className={styles['c-auth__hero-title']}>El Guacal</p>
      </aside>

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
