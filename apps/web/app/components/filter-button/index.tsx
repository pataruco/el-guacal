import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import styles from './index.module.scss';

const FilterButton = () => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  const toggleFilter = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className={styles['c-filter']}>
      <button
        type="button"
        className={styles['c-filter__btn']}
        onClick={toggleFilter}
        aria-label={t('filter.toggle') || 'Toggle Filter'}
      >
        {t('filter.label') || 'Filter'}
      </button>

      {isOpen && (
        <div className={styles['c-filter__panel']}>
          <div className={styles['c-filter__header']}>
            <h3>{t('filter.title') || 'Filters'}</h3>
            <button
              type="button"
              className={styles['c-filter__close']}
              onClick={toggleFilter}
            >
              &times;
            </button>
          </div>
          <div className={styles['c-filter__content']}>
            <p>
              {t('filter.placeholder') || 'Filter options will appear here.'}
            </p>
          </div>
          <div className={styles['c-filter__footer']}>
            <button
              type="button"
              className={styles['c-filter__done']}
              onClick={toggleFilter}
            >
              {t('filter.done') || 'Done'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FilterButton;
