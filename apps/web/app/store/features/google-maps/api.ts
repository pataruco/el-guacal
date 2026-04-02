import { createApi } from '@reduxjs/toolkit/query/react';

export interface AutocompleteSuggestion {
  description: string;
  place_id: string;
}

export const googleMapsApiSlice = createApi({
  baseQuery: async (args: {
    type: 'autocomplete' | 'geocode' | 'reverse-geocode';
    input: string;
  }) => {
    // Wait for Google Maps SDK to be available
    if (typeof google === 'undefined') {
      return { error: 'Google Maps SDK not loaded' };
    }

    try {
      if (args.type === 'autocomplete') {
        const service = new google.maps.places.AutocompleteService();
        return new Promise((resolve) => {
          service.getPlacePredictions(
            { input: args.input },
            (predictions, status) => {
              if (
                status !== google.maps.places.PlacesServiceStatus.OK ||
                !predictions
              ) {
                resolve({ data: [] });
                return;
              }
              resolve({
                data: predictions.map((p) => ({
                  description: p.description,
                  place_id: p.place_id,
                })) as AutocompleteSuggestion[],
              });
            },
          );
        });
      }

      if (args.type === 'reverse-geocode') {
        const [lat, lng] = args.input.split(',').map(Number);
        const geocoder = new google.maps.Geocoder();
        return new Promise((resolve) => {
          geocoder.geocode({ location: { lat, lng } }, (results, status) => {
            if (status !== google.maps.GeocoderStatus.OK || !results) {
              resolve({ data: null });
              return;
            }
            if (results.length > 0) {
              resolve({ data: results[0].formatted_address });
            } else {
              resolve({ data: null });
            }
          });
        });
      }

      const geocoder = new google.maps.Geocoder();
      return new Promise((resolve) => {
        geocoder.geocode({ placeId: args.input }, (results, status) => {
          if (status !== google.maps.GeocoderStatus.OK || !results) {
            resolve({ data: null });
            return;
          }
          if (results.length > 0) {
            const { lat, lng } = results[0].geometry.location;
            resolve({ data: { lat: lat(), lng: lng() } });
          } else {
            resolve({ data: null });
          }
        });
      });
    } catch (error) {
      return { error: (error as Error).message };
    }
  },
  endpoints: (builder) => ({
    getAutocompleteSuggestions: builder.query<AutocompleteSuggestion[], string>(
      {
        query: (input) => ({ input, type: 'autocomplete' }),
      },
    ),
    getGeocode: builder.query<{ lat: number; lng: number } | null, string>({
      query: (placeId) => ({ input: placeId, type: 'geocode' }),
    }),
    getReverseGeocode: builder.query<string | null, string>({
      query: (latLng) => ({ input: latLng, type: 'reverse-geocode' }),
    }),
  }),
  reducerPath: 'googleMapsApi',
});

export const {
  useGetAutocompleteSuggestionsQuery,
  useLazyGetGeocodeQuery,
  useLazyGetReverseGeocodeQuery,
} = googleMapsApiSlice;
