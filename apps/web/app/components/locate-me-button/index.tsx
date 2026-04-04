import { useTranslation } from 'react-i18next';
import { getUserLocation, selectMap } from '@/store/features/map/slice';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import styles from './index.module.scss';

const LocateMeButton = () => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const { userLocationStatus } = useAppSelector(selectMap);

  const handleLocateMe = () => {
    dispatch(getUserLocation());
  };

  const isLoading = userLocationStatus === 'loading';

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
        <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="2" />
        <circle cx="12" cy="12" r="1" fill="currentColor" />
        <line
          x1="12"
          y1="2"
          x2="12"
          y2="6"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <line
          x1="12"
          y1="18"
          x2="12"
          y2="22"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <line
          x1="2"
          y1="12"
          x2="6"
          y2="12"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <line
          x1="18"
          y1="12"
          x2="22"
          y2="12"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    </button>
  );
};

export default LocateMeButton;
