import { getCurrentLocation } from "./libs/get-current-location";

// biome-ignore lint/correctness/noUnusedVariables: We are setting up the map
let map: google.maps.Map;
const mapElement = document.getElementById("map") as HTMLElement;

const initMap = async () => {
	const center: google.maps.LatLngLiteral = await getCurrentLocation();
	map = new google.maps.Map(mapElement, {
		center,
		zoom: 13,
	});
};

window.addEventListener("load", () => {
	initMap();
});
