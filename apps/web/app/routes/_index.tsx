import { useEffect } from 'react';
import { type MetaFunction, useNavigate } from 'react-router';
import { detectLocale } from '@/i18n';

export const meta: MetaFunction = () => [
  { title: 'El Guacal' },
  { content: '0; url=/en', httpEquiv: 'refresh', tagName: 'meta' },
];

export default function RootRedirect() {
  const navigate = useNavigate();

  useEffect(() => {
    navigate(`/${detectLocale()}`, { replace: true });
  }, [navigate]);

  return (
    <main
      style={{
        alignItems: 'center',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        minHeight: '100vh',
        padding: '2rem',
        textAlign: 'center',
      }}
    >
      <h1>El Guacal</h1>
      <p>
        <a href="/en">Continue in English</a>
        {' · '}
        <a href="/es">Continuar en español</a>
      </p>
    </main>
  );
}
