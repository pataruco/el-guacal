import { Provider } from 'react-redux';
import {
  Links,
  Meta,
  type MetaFunction,
  Outlet,
  Scripts,
  ScrollRestoration,
} from 'react-router';
import { onIdTokenChanged } from 'firebase/auth';
import { useEffect } from 'react';
import { clearAuth, setAuth } from './store/features/auth/slice';
import { useAppDispatch } from './store/hooks';
import { store } from './store/store';
import { auth } from './utils/firebase';
import './styles/index.scss';

export const meta: MetaFunction = () => {
  return [
    { title: 'El Guacal' },
    { content: 'El Guacal - Store Finder', name: 'description' },
  ];
};

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/vite.svg" type="image/svg+xml" />
        <Meta />
        <Links />
      </head>
      <body>
        <Provider store={store}>{children}</Provider>
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  const dispatch = useAppDispatch();

  useEffect(() => {
    const unsubscribe = onIdTokenChanged(auth, async (user) => {
      if (user) {
        const idToken = await user.getIdToken();
        dispatch(
          setAuth({
            idToken,
            user: {
              displayName: user.displayName,
              email: user.email,
              photoURL: user.photoURL,
              uid: user.uid,
            },
          }),
        );
      } else {
        dispatch(clearAuth());
      }
    });

    return () => unsubscribe();
  }, [dispatch]);

  return <Outlet />;
}
