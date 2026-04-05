import CookieBanner from '../cookie-banner';
import Footer from '../footer';
import { GoogleTag } from '../google-tag-manager';
import Header from '../header';

interface PageProps {
  children: React.ReactNode;
  className?: string;
  isHome?: boolean;
}

const Page = ({ children, className, isHome = false }: PageProps) => {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: isHome ? '100vh' : 'auto',
        minHeight: '100vh',
        overflow: isHome ? 'hidden' : 'visible',
        width: '100vw',
      }}
    >
      <GoogleTag />
      <CookieBanner />
      <Header />
      <main
        id="main-content"
        className={className ? className : ''}
        style={{ flex: 1, position: 'relative' }}
      >
        {children}
      </main>
      <Footer />
    </div>
  );
};

export default Page;
