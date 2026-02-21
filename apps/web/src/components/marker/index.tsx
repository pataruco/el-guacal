import {
	AdvancedMarker,
	CollisionBehavior,
	Pin,
} from "@vis.gl/react-google-maps";
import type React from "react";

interface MarkerProps {
	id: string;
	position: { lat: number; lng: number };
}

const Marker: React.FC<MarkerProps> = ({ id, position }) => {
	const handleOnClick = (event: google.maps.MapMouseEvent) => {
		console.log({ event, id });
	};

	return (
		<AdvancedMarker
			key={id}
			position={position}
			collisionBehavior={CollisionBehavior.REQUIRED_AND_HIDES_OPTIONAL}
			clickable
			onClick={handleOnClick}
		>
			<Pin background={"#FBBC04"} glyphColor={"#000"} borderColor={"#000"} />
		</AdvancedMarker>
	);
};

export default Marker;
