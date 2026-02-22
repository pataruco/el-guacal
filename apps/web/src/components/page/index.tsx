import Footer from '../footer';
import Header from '../header';
import styles from './index.module.scss';

interface PageProps {
  children: React.ReactNode;
  className?: string;
}

const Page = ({ children, className }: PageProps) => {
  return (
    <>
      <Header />
      <main className={className ? `${className} ${styles.page}` : styles.page}>
        {children}
      </main>
      <Footer />
    </>
  );
};

export default Page;
