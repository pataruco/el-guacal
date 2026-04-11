import { onIdTokenChanged } from 'firebase/auth';
import { useEffect } from 'react';
import { I18nextProvider } from 'react-i18next';
import { Provider } from 'react-redux';
import {
  Links,
  type LinksFunction,
  Meta,
  type MetaFunction,
  Outlet,
  Scripts,
  ScrollRestoration,
} from 'react-router';
import { ENGLISH, i18n } from './i18n';
import { clearAuth, setAuth } from './store/features/auth/slice';
import { useAppDispatch } from './store/hooks';
import { store } from './store/store';
import { auth } from './utils/firebase';
// Design tokens (CSS custom properties + @layer declarations).
// Imported before index.scss so the `@layer reset, tokens, base,
// components, utilities` declaration registers first and every
// downstream SCSS module sees the tokens. See ADR 0014.
import './styles/tokens.css';
import './styles/index.scss';
import { GoogleTag } from './components/google-tag-manager';

export const meta: MetaFunction = () => {
  return [
    { title: 'El Guacal' },
    { content: 'El Guacal - Store Finder', name: 'description' },
    { charSet: 'utf-8' },
    { content: 'width=device-width, initial-scale=1', name: 'viewport' },
  ];
};

// Inter Variable is served from Google Fonts as a true variable font
// (`wght@100..900`). First paint runs on the `system-ui` fallback that
// `--font-sans` defines and swaps to Inter when the file arrives
// (`display=swap`). The `preconnect` to fonts.gstatic.com removes the
// DNS + TLS handshake from the critical path — the CSS parser would
// otherwise discover the origin only after parsing the stylesheet.
// See ADR 0014.
export const links: LinksFunction = () => [
  { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
  {
    rel: 'preconnect',
    href: 'https://fonts.gstatic.com',
    crossOrigin: 'anonymous',
  },
  {
    rel: 'stylesheet',
    href: 'https://fonts.googleapis.com/css2?family=Inter:wght@100..900&display=swap',
  },
];

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang={i18n.language || ENGLISH}>
      <head>
        <GoogleTag />
        <link rel="icon" href="/vite.svg" type="image/svg+xml" />
        <Meta />
        <Links />
      </head>
      <body>
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>
        <Provider store={store}>
          <I18nextProvider i18n={i18n}>{children}</I18nextProvider>
        </Provider>
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
