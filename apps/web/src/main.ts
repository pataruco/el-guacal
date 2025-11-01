const mapElement = document.getElementById("map") as HTMLElement;

let map: google.maps.Map;
const center: google.maps.LatLngLiteral = { lat: 30, lng: -110 };

async function initMap(): Promise<void> {
	map = await new google.maps.Map(mapElement, {
		center,
		zoom: 8,
	});
}

// Wait for Google Maps API to load before initializing
window.addEventListener("load", () => {
	initMap();
});
