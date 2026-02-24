import type { PayloadAction } from '@reduxjs/toolkit';
import { createAppSlice } from '../../createAppSlice';

const LONDON = { lat: 51.51044, lng: -0.11564 };

export type MapSliceState = {
  center: {
    lat: number;
    lng: number;
  };
  status: 'idle' | 'loading' | 'failed' | 'success';
  zoom: number;
};

const initialState: MapSliceState = {
  center: LONDON,
  status: 'idle',
  zoom: 10,
};

export const mapSlice = createAppSlice({
  initialState,
  name: 'map',
  reducers: (create) => ({
    getUserLocation: create.asyncThunk(
      async () => {
        const position = await new Promise<GeolocationPosition>(
          (resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject);
          },
        );

        return {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
      },
      {
        fulfilled: (state, action) => {
          state.center = action.payload;
          state.status = 'success';
        },
        pending: (state) => {
          state.status = 'loading';
        },
        rejected: (state, action) => {
          console.error('getUserLocation rejected:', action.error);
          state.center = LONDON;
          state.status = 'failed';
        },
      },
    ),
    setCenter: create.reducer(
      (state, action: PayloadAction<MapSliceState['center']>) => {
        state.center = action.payload;
      },
    ),
    setStatus: create.reducer(
      (state, action: PayloadAction<MapSliceState['status']>) => {
        state.status = action.payload;
      },
    ),
    setZoom: create.reducer(
      (state, action: PayloadAction<MapSliceState['zoom']>) => {
        state.zoom = action.payload;
      },
    ),
  }),
  selectors: {
    selectCenter: (state) => state.center,
    selectMap: (state) => state,
    selectStatus: (state) => state.status,
    selectZoom: (state) => state.zoom,
  },
});

export const { selectCenter, selectStatus, selectZoom, selectMap } =
  mapSlice.selectors;

export const { setStatus, setCenter, setZoom, getUserLocation } =
  mapSlice.actions;
