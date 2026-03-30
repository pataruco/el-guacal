import Footer from '../footer';
import Header from '../header';

interface PageProps {
  children: React.ReactNode;
  className?: string;
}

const Page = ({ children, className }: PageProps) => {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        overflow: 'hidden',
        width: '100vw',
      }}
    >
      <Header />
      <main
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
