// Map marker — Figma node 109:1438 ("map pin"). Two states:
//   · default (unselected) → 32×43 teardrop, blue-700 fill,
//                              grey-300 stroke, white dot centre
//   · active (this store is the currently-selected one) →
//                              48×64 teardrop, blue-800 fill,
//                              grey-300 stroke, white star centre
//
// The component reads selectedStoreId from Redux so it can
// upgrade itself to the "active" variant when its own id
// matches — no prop drilling required.
import { AdvancedMarker, CollisionBehavior } from '@vis.gl/react-google-maps';
import type React from 'react';
import {
  selectStoreState,
  setShowStore,
  setStoreId,
} from '@/store/features/stores/slice';
import { searchResultOpened } from '@/store/features/tracking/thunks';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import styles from './index.module.scss';

interface MarkerProps {
  id: string;
  name: string;
  position: google.maps.LatLngLiteral;
}

const Marker: React.FC<MarkerProps> = ({ id, name, position }) => {
  const dispatch = useAppDispatch();
  const { storeId: selectedStoreId, show } = useAppSelector(selectStoreState);
  const isActive = show && selectedStoreId === id;

  const handleOnClick = (_event: google.maps.MapMouseEvent) => {
    dispatch(setStoreId(id));
    dispatch(setShowStore(true));
    dispatch(searchResultOpened({ storeId: id, surface: 'map' }));
  };

  return (
    <AdvancedMarker
      key={id}
      position={position}
      collisionBehavior={CollisionBehavior.OPTIONAL_AND_HIDES_LOWER_PRIORITY}
      clickable
      onClick={handleOnClick}
    >
      <div
        className={`${styles['c-marker']} ${isActive ? styles['c-marker--active'] : ''}`}
      >
        {isActive ? (
          <svg
            width="48"
            height="64"
            viewBox="0 0 52 69.4222"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            role="img"
            aria-labelledby={`marker-title-${id}`}
          >
            <title id={`marker-title-${id}`}>{name}</title>
            {/* Pin body — Figma node 109:1437 (active variant) */}
            <path
              d="M26 1C39.8018 1 51 12.1274 51 25.8652C50.9999 29.4094 49.404 33.7676 47.1406 38.2109C44.8601 42.6879 41.8304 47.3858 38.8164 51.6475C35.7999 55.9127 32.7856 59.7611 30.5264 62.542C29.3963 63.933 28.4542 65.0587 27.7939 65.8369C27.464 66.2258 27.2039 66.5278 27.0264 66.7334C26.9378 66.836 26.8695 66.9146 26.8232 66.9678C26.8003 66.9941 26.7825 67.0147 26.7705 67.0283C26.7647 67.035 26.7599 67.0404 26.7568 67.0439C26.7554 67.0456 26.7538 67.0469 26.7529 67.0479L26.752 67.0498L26 67.9062L25.248 67.0498L25.2471 67.0479C25.2462 67.0469 25.2446 67.0456 25.2432 67.0439C25.2401 67.0404 25.2353 67.035 25.2295 67.0283C25.2175 67.0147 25.1997 66.9942 25.1768 66.9678C25.1305 66.9146 25.0622 66.836 24.9736 66.7334C24.7961 66.5278 24.536 66.2258 24.2061 65.8369C23.5458 65.0587 22.6037 63.933 21.4736 62.542C19.2144 59.7611 16.2001 55.9127 13.1836 51.6475C10.1696 47.3858 7.1399 42.6879 4.85938 38.2109C2.59601 33.7676 1.0001 29.4094 1 25.8652C1 12.1274 12.1982 1 26 1Z"
              fill="var(--color-blue-800)"
              stroke="var(--color-border)"
              strokeWidth="2"
            />
            {/* Star — Figma node 108:2074 */}
            <g transform="translate(14.293, 13.04)">
              <path
                d="M11.7073 0L15.3249 7.32878L23.4146 8.51122L17.561 14.2127L18.9424 22.2673L11.7073 18.4624L4.4722 22.2673L5.85366 14.2127L0 8.51122L8.08976 7.32878L11.7073 0Z"
                fill="var(--color-white)"
              />
            </g>
          </svg>
        ) : (
          <svg
            width="32"
            height="43"
            viewBox="0 0 36 47.9588"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            role="img"
            aria-labelledby={`marker-title-${id}`}
          >
            <title id={`marker-title-${id}`}>{name}</title>
            {/* Pin body — Figma node 109:1436 (default variant) */}
            <path
              d="M18 44.9268L17.248 45.5869L18 46.4424L18.752 45.5869L18 44.9268ZM18 44.9268L18.752 45.5859L18.7529 45.585C18.7535 45.5843 18.754 45.5831 18.7549 45.582C18.757 45.5796 18.7607 45.5768 18.7646 45.5723C18.7727 45.563 18.7843 45.549 18.7998 45.5312C18.8309 45.4955 18.8771 45.4428 18.9365 45.374C19.0555 45.2363 19.2294 45.0336 19.4502 44.7734C19.8917 44.2531 20.5213 43.5007 21.2764 42.5713C22.7856 40.7136 24.8 38.1422 26.8164 35.291C28.8304 32.4433 30.8601 29.2966 32.3906 26.292C33.904 23.3209 34.9999 20.356 35 17.9102C35 8.56574 27.3835 1 18 1C8.61649 1 1 8.56574 1 17.9102C1.00006 20.356 2.09596 23.3209 3.60938 26.292C5.13991 29.2966 7.16959 32.4433 9.18359 35.291C11.2 38.1422 13.2144 40.7136 14.7236 42.5713C15.4787 43.5007 16.1083 44.2531 16.5498 44.7734C16.7706 45.0336 16.9445 45.2363 17.0635 45.374C17.1229 45.4428 17.1691 45.4955 17.2002 45.5312C17.2157 45.549 17.2273 45.563 17.2354 45.5723C17.2393 45.5768 17.243 45.5796 17.2451 45.582C17.246 45.5831 17.2465 45.5843 17.2471 45.585L17.248 45.5859L18 44.9268Z"
              fill="var(--color-primary)"
              stroke="var(--color-border)"
              strokeWidth="2"
            />
            {/* Centre dot — Figma node 135:1059 */}
            <circle cx="18" cy="18" r="4" fill="var(--color-white)" />
          </svg>
        )}
      </div>
    </AdvancedMarker>
  );
};

export default Marker;
