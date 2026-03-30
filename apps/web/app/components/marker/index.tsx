import { AdvancedMarker, CollisionBehavior } from '@vis.gl/react-google-maps';
import type React from 'react';
import { setShowStore, setStoreId } from '@/store/features/stores/slice';
import { useAppDispatch } from '@/store/hooks';
import styles from './index.module.scss';

interface MarkerProps {
  id: string;
  name: string;
  position: google.maps.LatLngLiteral;
}

const Marker: React.FC<MarkerProps> = ({ id, name, position }) => {
  const dispatch = useAppDispatch();
  const handleOnClick = (_event: google.maps.MapMouseEvent) => {
    dispatch(setStoreId(id));
    dispatch(setShowStore(true));
  };

  return (
    <AdvancedMarker
      key={id}
      position={position}
      collisionBehavior={CollisionBehavior.OPTIONAL_AND_HIDES_LOWER_PRIORITY}
      clickable
      onClick={handleOnClick}
    >
      <div className={styles['c-marker']}>
        <svg
          width="48"
          height="48"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          role="img"
          aria-labelledby={`marker-title-${id}`}
        >
          <title id={`marker-title-${id}`}>{name}</title>
          <path
            d="M12 21.325C12 21.325 19 14.3625 19 9C19 5.13401 15.866 2 12 2C8.13401 2 5 5.13401 5 9C5 14.3625 12 21.325 12 21.325Z"
            fill="#990000"
            stroke="#0A1931"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          <circle cx="12" cy="9" r="3" fill="#ffffff" />
        </svg>
      </div>
    </AdvancedMarker>
  );
};

export default Marker;
