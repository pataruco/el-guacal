import {
  AdvancedMarker,
  CollisionBehavior,
  Pin,
} from '@vis.gl/react-google-maps';
import type React from 'react';
import { setShowStore, setStoreId } from '@/store/features/stores/slice';
import { useAppDispatch } from '@/store/hooks';

interface MarkerProps {
  id: string;
  position: google.maps.LatLngLiteral;
}

const Marker: React.FC<MarkerProps> = ({ id, position }) => {
  const dispatch = useAppDispatch();
  const handleOnClick = (_event: google.maps.MapMouseEvent) => {
    console.log({ id });
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
      <Pin background={'#FBBC04'} glyphColor={'#000'} borderColor={'#000'} />
    </AdvancedMarker>
  );
};

export default Marker;
