import { data } from 'react-router';

export function loader() {
  return data(null, { status: 404 });
}

export default function CatchAll() {
  return (
    <main
      style={{
        alignItems: 'center',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        minHeight: '60vh',
        padding: '2rem',
        textAlign: 'center',
      }}
    >
      <h1>404</h1>
      <p>The page you are looking for does not exist.</p>
      <a href="/" style={{ marginTop: '1rem' }}>
        Go back home
      </a>
    </main>
  );
}
