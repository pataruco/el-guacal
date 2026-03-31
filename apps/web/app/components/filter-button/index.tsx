import { Accordion } from '@base-ui/react/accordion';
import type * as React from 'react';
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
            <Accordion.Root multiple className={styles['c-filter__accordion']}>
              <Accordion.Item
                className={styles['c-filter__item']}
                value="categories"
              >
                <Accordion.Header className={styles['c-filter__item-header']}>
                  <Accordion.Trigger className={styles['c-filter__trigger']}>
                    {t('filter.categories') || 'Categories'}
                    <PlusIcon className={styles['c-filter__icon']} />
                  </Accordion.Trigger>
                </Accordion.Header>
                <Accordion.Panel className={styles['c-filter__panel-content']}>
                  <div className={styles['c-filter__inner-content']}>
                    {t('filter.placeholder') ||
                      'Filter options will appear here.'}
                  </div>
                </Accordion.Panel>
              </Accordion.Item>
            </Accordion.Root>
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

function PlusIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg
      viewBox="0 0 12 12"
      fill="currentcolor"
      {...props}
      aria-hidden="true"
      role="img"
    >
      <title>Plus</title>
      <path d="M6.75 0H5.25V5.25H0V6.75L5.25 6.75V12H6.75V6.75L12 6.75V5.25H6.75V0Z" />
    </svg>
  );
}

export default FilterButton;
