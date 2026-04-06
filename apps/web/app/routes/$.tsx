import type { MetaFunction } from 'react-router';
import Page from '@/components/page';

export const meta: MetaFunction = () => {
  return [{ title: '404 - El Guacal' }];
};

export default function CatchAll() {
  return (
    <Page>
      <main>
        <h1>404</h1>
        <p>Page not found</p>
      </main>
    </Page>
  );
}
