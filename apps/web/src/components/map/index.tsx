import {
  APIProvider,
  Map as GoogleMap,
  type MapCameraChangedEvent,
} from '@vis.gl/react-google-maps';
import { useGetStoresNearQuery } from '@/graphql/queries/get-stores-near/index.generated';
import type { Radius } from '../../graphql/types';
import {
  getUserLocation,
  selectMap,
  setCenter,
  setZoom,
} from '../../store/features/map/slice';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import CustomMarker from '../marker';
import styles from './index.module.scss';

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
const GOOGLE_MAPS_ID = import.meta.env.VITE_GOOGLE_MAPS_ID;

const MapComponent = () => {
  const dispatch = useAppDispatch();
  const { center, zoom } = useAppSelector(selectMap);

  const roundedZoom = Math.round(zoom);
  const skip = roundedZoom < 11 || roundedZoom > 22;
  const radius = skip ? 'ZOOM_11' : (`ZOOM_${roundedZoom}` as Radius);

  const { data, isLoading, error } = useGetStoresNearQuery(
    {
      location: center,
      radius,
    },
    { skip },
  );

  const handleOnLoad = () => {
    dispatch(getUserLocation());
  };

  const handleOnCameraChanged = (ev: MapCameraChangedEvent) => {
    dispatch(setCenter(ev.detail.center));
    dispatch(setZoom(ev.detail.zoom));
  };

  // TODO: add Advanced marker and MapId
  return (
    <div className={isLoading ? styles.loading : styles.map}>
      <APIProvider apiKey={GOOGLE_MAPS_API_KEY} onLoad={handleOnLoad}>
        <GoogleMap
          defaultZoom={13}
          center={center}
          defaultCenter={center}
          onCameraChanged={handleOnCameraChanged}
          mapId={GOOGLE_MAPS_ID}
          disableDefaultUI
          reuseMaps
        >
          {data?.storesNear.map((store) => (
            <CustomMarker
              key={store.storeId}
              id={store.storeId}
              position={store.location}
            />
          ))}
        </GoogleMap>
      </APIProvider>
    </div>
  );
};

export default MapComponent;
