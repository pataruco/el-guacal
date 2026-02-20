import {
  APIProvider,
  Map as GoogleMap,
  type MapCameraChangedEvent,
} from '@vis.gl/react-google-maps';
import styles from './index.module.scss';

const MapComponent = () => {
  return (
    <div className={styles.map}>
      <APIProvider
        apiKey={'AIzaSyBD3PvjPjasXy9gJWqxHAHGLSVzKAfbN5M'}
        onLoad={() => console.log('Maps API has loaded.')}
      >
        <GoogleMap
          style={{ height: '100%', width: '100%' }}
          defaultZoom={13}
          defaultCenter={{ lat: -33.860664, lng: 151.208138 }}
          onCameraChanged={(ev: MapCameraChangedEvent) =>
            console.log(
              'camera changed:',
              ev.detail.center,
              'zoom:',
              ev.detail.zoom,
            )
          }
        />
      </APIProvider>
    </div>
  );
};

export default MapComponent;
