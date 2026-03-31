import styles from './index.module.scss';

const Footer = () => {
  return (
    <footer className={styles['c-footer']}>
      <p className={styles['c-footer__text']}>
        EL GUACAL © {new Date().getFullYear()}
      </p>
    </footer>
  );
};

export default Footer;
