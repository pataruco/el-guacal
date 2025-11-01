export const getCurrentLocation = async () => {
	const position = await new Promise<GeolocationPosition>((resolve, reject) => {
		navigator.geolocation.getCurrentPosition(resolve, reject);
	});
	return {
		lat: position.coords.latitude ?? 51.4500722,
		lng: position.coords.longitude ?? -0.1483491,
	};
};
