import { EmailAuthProvider, GoogleAuthProvider } from 'firebase/auth';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { selectAuth } from '@/store/features/auth/slice';
import { useAppSelector } from '@/store/hooks';
import { auth } from '@/utils/firebase';

const AuthPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAppSelector(selectAuth);
  const [firebaseui, setFirebaseui] = useState<
    typeof import('firebaseui') | null
  >(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      Promise.all([
        import('firebaseui'),
        import('firebaseui/dist/firebaseui.css?url'),
      ]).then(([module, css]) => {
        setFirebaseui(module.default || module);
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = css.default;
        document.head.appendChild(link);
      });
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
      return;
    }

    if (!firebaseui || typeof window === 'undefined') return;

    const AuthUI = firebaseui.auth.AuthUI;
    const ui = AuthUI.getInstance() || new AuthUI(auth);

    ui.start('#firebaseui-auth-container', {
      callbacks: {
        signInSuccessWithAuthResult: () => {
          // Returning false to prevent redirect by FirebaseUI
          // our listener in root.tsx will handle navigation if needed
          return false;
        },
      },
      signInOptions: [
        GoogleAuthProvider.PROVIDER_ID,
        EmailAuthProvider.PROVIDER_ID,
      ],
      signInSuccessUrl: '/',
    });
  }, [isAuthenticated, navigate, firebaseui]);

  return (
    <div style={{ padding: '2rem', textAlign: 'center' }}>
      <h1>Login / Sign Up</h1>
      <div id="firebaseui-auth-container" />
    </div>
  );
};

export default AuthPage;
