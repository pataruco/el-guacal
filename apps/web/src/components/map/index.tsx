import {
	APIProvider,
	Map as GoogleMap,
	type MapCameraChangedEvent,
} from "@vis.gl/react-google-maps";
import { useGetStoresNearQuery } from "@/graphql/queries/get-stores-near/index.generated";
import { Radius } from "../../graphql/types";
import {
	getUserLocation,
	selectMap,
	setCenter,
	setZoom,
} from "../../store/features/map/slice";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import styles from "./index.module.scss";

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

const MapComponent = () => {
	const dispatch = useAppDispatch();
	const { center } = useAppSelector(selectMap);

	const { data, isLoading } = useGetStoresNearQuery({
		location: center,
		radius: Radius.Km_10,
	});

	console.log({ data, isLoading });

	const handleOnLoad = () => {
		dispatch(getUserLocation());
	};

	const handleOnCameraChanged = (ev: MapCameraChangedEvent) => {
		dispatch(setCenter(ev.detail.center));
		dispatch(setZoom(ev.detail.zoom));
	};

	return (
		<div className={styles.map}>
			<APIProvider apiKey={GOOGLE_MAPS_API_KEY} onLoad={handleOnLoad}>
				<GoogleMap
					defaultZoom={13}
					center={center}
					defaultCenter={center}
					onCameraChanged={handleOnCameraChanged}
				/>
			</APIProvider>
		</div>
	);
};

export default MapComponent;
