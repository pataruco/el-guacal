import { useTranslation } from 'react-i18next';
import { getUserLocation, selectMap } from '@/store/features/map/slice';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import styles from './index.module.scss';

const LocateMeButton = () => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const { status } = useAppSelector(selectMap);

  const handleLocateMe = () => {
    dispatch(getUserLocation());
  };

  const isLoading = status === 'loading';

  return (
    <button
      type="button"
      className={styles['c-locate-me']}
      onClick={handleLocateMe}
      disabled={isLoading}
      aria-label={t('map.locateMe') || 'Find my location'}
    >
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <path
          d="M12 2C7.58172 2 4 5.58172 4 10C4 14.4183 7.58172 18 12 18C16.4183 18 20 14.4183 20 10C20 5.58172 16.4183 2 12 2ZM12 4C15.3137 4 18 6.68629 18 10C18 13.3137 15.3137 16 12 16C8.68629 16 6 13.3137 6 10C6 6.68629 8.68629 4 12 4ZM12 7C10.3431 7 9 8.34315 9 10C9 11.6569 10.3431 13 12 13C13.6569 13 15 11.6569 15 10C15 8.34315 13.6569 7 12 7ZM12 9C12.5523 9 13 9.44772 13 10C13 10.5523 12.5523 11 12 11C11.4477 11 11 10.5523 11 10C11 9.44772 11.4477 9 12 9Z"
          fill="currentColor"
        />
        <path
          d="M12 18L12 22M8 20L16 20"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
      {isLoading ? '...' : ''}
    </button>
  );
};

export default LocateMeButton;
