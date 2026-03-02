import { configureStore } from '@reduxjs/toolkit';
import { describe, expect, it, vi } from 'vitest';
import reducer, {
  getUserLocation,
  setCenter,
  setStatus,
  setZoom,
} from '../slice';

describe('mapSlice', () => {
  const initialState = {
    center: { lat: 51.51044, lng: -0.11564 },
    status: 'idle',
    zoom: 10,
  };

  it('should handle initial state', () => {
    expect(reducer(undefined, { type: 'unknown' })).toEqual(initialState);
  });

  it('should handle setCenter', () => {
    const newCenter = { lat: 40.7128, lng: -74.006 };
    const actual = reducer(initialState, setCenter(newCenter));
    expect(actual.center).toEqual(newCenter);
  });

  it('should handle setStatus', () => {
    const actual = reducer(initialState, setStatus('loading'));
    expect(actual.status).toBe('loading');
  });

  it('should handle setZoom', () => {
    const actual = reducer(initialState, setZoom(15));
    expect(actual.zoom).toBe(15);
  });

  describe('getUserLocation thunk', () => {
    it('should handle successful geolocation', async () => {
      const mockPosition = {
        coords: {
          latitude: 40.7128,
          longitude: -74.006,
        },
      };

      const getCurrentPositionMock = vi.fn().mockImplementation((success) => {
        success(mockPosition);
      });

      vi.stubGlobal('navigator', {
        geolocation: {
          getCurrentPosition: getCurrentPositionMock,
        },
      });

      const store = configureStore({
        reducer: { map: reducer },
      });

      await store.dispatch(getUserLocation());

      const state = store.getState().map;
      expect(state.center).toEqual({ lat: 40.7128, lng: -74.006 });
      expect(state.status).toBe('success');
    });

    it('should handle failed geolocation', async () => {
      const getCurrentPositionMock = vi.fn().mockImplementation((_, error) => {
        error(new Error('Geolocation failed'));
      });

      vi.stubGlobal('navigator', {
        geolocation: {
          getCurrentPosition: getCurrentPositionMock,
        },
      });

      // Silence console.error for this test
      vi.spyOn(console, 'error').mockImplementation(() => {});

      const store = configureStore({
        reducer: { map: reducer },
      });

      await store.dispatch(getUserLocation());

      const state = store.getState().map;
      expect(state.center).toEqual(initialState.center);
      expect(state.status).toBe('failed');
    });
  });
});
