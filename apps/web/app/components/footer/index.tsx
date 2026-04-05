import styles from './index.module.scss';

const Footer = () => {
  return (
    <footer className={styles['c-footer']}>
      <div className={styles['c-footer__container']}>
        <p className={styles['c-footer__text']}>
          EL GUACAL © {new Date().getFullYear()}
        </p>
      </div>
    </footer>
  );
};

export default Footer;
