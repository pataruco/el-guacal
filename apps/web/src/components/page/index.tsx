import Footer from '../footer';
import Header from '../header';

interface PageProps {
  children: React.ReactNode;
  className?: string;
}

const Page = ({ children, className }: PageProps) => {
  return (
    <>
      <Header />
      <main className={className ? className : ''}>{children}</main>
      <Footer />
    </>
  );
};

export default Page;
