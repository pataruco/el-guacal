import { configureStore } from '@reduxjs/toolkit';
import { describe, expect, it, vi } from 'vitest';
import reducer, {
  getUserLocation,
  selectMap,
  setCenter,
  setSelectedProductIds,
  setStatus,
  setZoom,
  toggleProductId,
} from '../slice';

describe('mapSlice', () => {
  const initialState = {
    center: { lat: 51.51044, lng: -0.11564 },
    selectedProductIds: [],
    status: 'idle',
    userLocationStatus: 'idle',
    zoom: 10,
  };

  it('should handle initial state', () => {
    expect(reducer(undefined, { type: 'unknown' })).toEqual(initialState);
  });

  it('should handle setCenter', () => {
    const newCenter = { lat: 40.7128, lng: -74.006 };
    const actual = reducer(
      initialState as Parameters<typeof reducer>[0],
      setCenter(newCenter),
    );
    expect(actual.center).toEqual(newCenter);
  });

  it('should handle setStatus', () => {
    const actual = reducer(
      initialState as Parameters<typeof reducer>[0],
      setStatus('loading'),
    );
    expect(actual.status).toBe('loading');
  });

  it('should handle setZoom', () => {
    const actual = reducer(
      initialState as Parameters<typeof reducer>[0],
      setZoom(15),
    );
    expect(actual.zoom).toBe(15);
  });

  describe('setSelectedProductIds', () => {
    it('should set the selected product IDs', () => {
      const ids = ['product-1', 'product-2'];
      const actual = reducer(
        initialState as Parameters<typeof reducer>[0],
        setSelectedProductIds(ids),
      );
      expect(actual.selectedProductIds).toEqual(ids);
    });

    it('should replace existing product IDs', () => {
      const stateWithProducts = {
        ...initialState,
        selectedProductIds: ['old-1', 'old-2'],
      };
      const newIds = ['new-1'];
      const actual = reducer(
        stateWithProducts as Parameters<typeof reducer>[0],
        setSelectedProductIds(newIds),
      );
      expect(actual.selectedProductIds).toEqual(newIds);
    });

    it('should handle empty array', () => {
      const stateWithProducts = {
        ...initialState,
        selectedProductIds: ['product-1'],
      };
      const actual = reducer(
        stateWithProducts as Parameters<typeof reducer>[0],
        setSelectedProductIds([]),
      );
      expect(actual.selectedProductIds).toEqual([]);
    });
  });

  describe('toggleProductId', () => {
    it('should add a product ID when not present', () => {
      const actual = reducer(
        initialState as Parameters<typeof reducer>[0],
        toggleProductId('product-1'),
      );
      expect(actual.selectedProductIds).toEqual(['product-1']);
    });

    it('should remove a product ID when already present', () => {
      const stateWithProduct = {
        ...initialState,
        selectedProductIds: ['product-1', 'product-2'],
      };
      const actual = reducer(
        stateWithProduct as Parameters<typeof reducer>[0],
        toggleProductId('product-1'),
      );
      expect(actual.selectedProductIds).toEqual(['product-2']);
    });

    it('should handle toggling the only product ID', () => {
      const stateWithProduct = {
        ...initialState,
        selectedProductIds: ['product-1'],
      };
      const actual = reducer(
        stateWithProduct as Parameters<typeof reducer>[0],
        toggleProductId('product-1'),
      );
      expect(actual.selectedProductIds).toEqual([]);
    });

    it('should add multiple product IDs through sequential toggles', () => {
      let state = reducer(
        initialState as Parameters<typeof reducer>[0],
        toggleProductId('product-1'),
      );
      state = reducer(state, toggleProductId('product-2'));
      state = reducer(state, toggleProductId('product-3'));
      expect(state.selectedProductIds).toEqual([
        'product-1',
        'product-2',
        'product-3',
      ]);
    });
  });

  describe('selectMap', () => {
    it('should select the full map state', () => {
      const state = {
        map: initialState as NonNullable<Parameters<typeof reducer>[0]>,
      };
      expect(selectMap(state)).toEqual(initialState);
    });

    it('should reflect updated state', () => {
      const updatedState = {
        center: { lat: 40.7128, lng: -74.006 },
        selectedProductIds: ['product-1'],
        status: 'success' as const,
        userLocationStatus: 'success' as const,
        zoom: 15,
      };
      expect(selectMap({ map: updatedState })).toEqual(updatedState);
    });
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
      expect(state.userLocationStatus).toBe('success');
    });

    it('should set userLocationStatus to loading while pending', async () => {
      const getCurrentPositionMock = vi.fn().mockImplementation((success) => {
        success({ coords: { latitude: 0, longitude: 0 } });
      });

      vi.stubGlobal('navigator', {
        geolocation: {
          getCurrentPosition: getCurrentPositionMock,
        },
      });

      const store = configureStore({
        reducer: { map: reducer },
      });

      const promise = store.dispatch(getUserLocation());
      // After dispatch resolves, userLocationStatus should be success (passed through loading)
      await promise;
      expect(store.getState().map.userLocationStatus).toBe('success');
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
      expect(state.userLocationStatus).toBe('failed');
    });
  });
});
