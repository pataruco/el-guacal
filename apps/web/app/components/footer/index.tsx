import styles from './index.module.scss';

const Footer = () => {
  return (
    <footer className={styles['c-footer']}>
      <div className={styles['c-footer__container']}>
        <p>
          El Guacal © {new Date().getFullYear()} by{' '}
          <a href="https://pataruco.dev">Pedro Martín Valera </a>
        </p>
        <p>
          <a href="https://creativecommons.org/licenses/by/4.0/">
            Licenced Creative Commons Attribution 4.0 International
          </a>
        </p>
        <div className={styles['c-footer__cc']}>
          <picture>
            <img
              src="https://mirrors.creativecommons.org/presskit/icons/cc.svg"
              alt="Creative Commons"
            />
          </picture>
          <picture>
            <img
              src="https://mirrors.creativecommons.org/presskit/icons/by.svg"
              alt="Creative Commons By"
            />
          </picture>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
