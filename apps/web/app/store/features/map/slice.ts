import { createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import { createAppSlice } from '../../createAppSlice';

const LONDON = { lat: 51.51044, lng: -0.11564 };

type PromiseUIstate = 'idle' | 'loading' | 'failed' | 'success';

export type MapSliceState = {
  center: {
    lat: number;
    lng: number;
  };
  status: PromiseUIstate;
  userLocationStatus: PromiseUIstate;
  zoom: number;
  selectedProductIds: string[];
};

const initialState: MapSliceState = {
  center: LONDON,
  selectedProductIds: [],
  status: 'idle',
  userLocationStatus: 'idle',
  zoom: 10,
};

export const getUserLocation = createAsyncThunk(
  'map/getUserLocation',
  async () => {
    const position = await new Promise<GeolocationPosition>(
      (resolve, reject) => {
        if (!navigator.geolocation) {
          reject(new Error('Geolocation is not supported by this browser'));
          return;
        }
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
        });
      },
    );

    return {
      lat: position.coords.latitude,
      lng: position.coords.longitude,
    };
  },
);

export const mapSlice = createAppSlice({
  extraReducers: (builder) => {
    builder
      .addCase(getUserLocation.pending, (state) => {
        state.userLocationStatus = 'loading';
      })
      .addCase(getUserLocation.fulfilled, (state, action) => {
        state.center = action.payload;
        state.userLocationStatus = 'success';
      })
      .addCase(getUserLocation.rejected, (state, action) => {
        console.error('getUserLocation rejected:', action.error);
        state.center = LONDON;
        state.userLocationStatus = 'failed';
      });
  },
  initialState,
  name: 'map',
  reducers: (create) => ({
    setCenter: create.reducer(
      (state, action: PayloadAction<MapSliceState['center']>) => {
        state.center = action.payload;
      },
    ),
    setSelectedProductIds: create.reducer(
      (state, action: PayloadAction<string[]>) => {
        state.selectedProductIds = action.payload;
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
    toggleProductId: create.reducer((state, action: PayloadAction<string>) => {
      const index = state.selectedProductIds.indexOf(action.payload);
      if (index === -1) {
        state.selectedProductIds.push(action.payload);
      } else {
        state.selectedProductIds.splice(index, 1);
      }
    }),
  }),
  selectors: {
    selectMap: (state) => state,
  },
});

export const { selectMap } = mapSlice.selectors;

export const {
  setStatus,
  setCenter,
  setZoom,
  setSelectedProductIds,
  toggleProductId,
} = mapSlice.actions;

export default mapSlice.reducer;
