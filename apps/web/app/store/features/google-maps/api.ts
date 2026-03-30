import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

export interface AutocompleteSuggestion {
  description: string;
  place_id: string;
}

export interface AutocompleteResponse {
  predictions: AutocompleteSuggestion[];
  status: string;
}

export interface GeocodeResult {
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
}

export interface GeocodeResponse {
  results: GeocodeResult[];
  status: string;
}

export const googleMapsApiSlice = createApi({
  baseQuery: fetchBaseQuery({
    baseUrl: 'https://maps.googleapis.com/maps/api/',
  }),
  endpoints: (builder) => ({
    getAutocompleteSuggestions: builder.query<AutocompleteSuggestion[], string>(
      {
        query: (input) =>
          `place/autocomplete/json?input=${encodeURIComponent(input)}&key=${GOOGLE_MAPS_API_KEY}`,
        transformResponse: (response: AutocompleteResponse) =>
          response.predictions,
      },
    ),
    getGeocode: builder.query<{ lat: number; lng: number } | null, string>({
      query: (placeId) =>
        `geocode/json?place_id=${placeId}&key=${GOOGLE_MAPS_API_KEY}`,
      transformResponse: (response: GeocodeResponse) => {
        if (response.status === 'OK' && response.results.length > 0) {
          return response.results[0].geometry.location;
        }
        return null;
      },
    }),
  }),
  reducerPath: 'googleMapsApi',
});

export const { useGetAutocompleteSuggestionsQuery, useLazyGetGeocodeQuery } =
  googleMapsApiSlice;
