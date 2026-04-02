import { describe, expect, it } from 'vitest';
import reducer, {
  selectStoreState,
  setShowStore,
  setStore,
  setStoreId,
} from '../slice';

describe('storeSlice', () => {
  const initialState = {
    show: false,
    store: {
      address: '',
      createdAt: '',
      location: { lat: 0, lng: 0 },
      name: '',
      products: [],
      storeId: '',
      updatedAt: '',
    },
    storeId: '',
  };

  it('should handle initial state', () => {
    expect(reducer(undefined, { type: 'unknown' })).toEqual(initialState);
  });

  it('should handle setShowStore', () => {
    const actual = reducer(initialState, setShowStore(true));
    expect(actual.show).toBe(true);
  });

  it('should handle setStore', () => {
    const mockStore = {
      address: '123 Test St',
      createdAt: '2023-01-01',
      location: { lat: 40.7128, lng: -74.006 },
      name: 'Test Store',
      products: [],
      storeId: 'store-123',
      updatedAt: '2023-01-02',
    };
    const actual = reducer(initialState, setStore(mockStore));
    expect(actual.store).toEqual(mockStore);
  });

  it('should handle setStoreId', () => {
    const actual = reducer(initialState, setStoreId('store-456'));
    expect(actual.storeId).toBe('store-456');
    expect(actual.store.storeId).toBe('store-456');
  });

  describe('selectStoreState', () => {
    it('should select the full store state', () => {
      const state = { store: initialState };
      expect(selectStoreState(state)).toEqual(initialState);
    });

    it('should reflect updated state', () => {
      const updatedState = {
        show: true,
        store: {
          address: '456 Main St',
          createdAt: '2024-01-01',
          location: { lat: 51.5, lng: -0.1 },
          name: 'Updated Store',
          products: [
            {
              brand: 'Brand 1',
              createdAt: '2024-01-01',
              name: 'Product 1',
              productId: 'p1',
              updatedAt: '2024-06-01',
            },
          ],
          storeId: 'store-789',
          updatedAt: '2024-06-01',
        },
        storeId: 'store-789',
      };
      expect(selectStoreState({ store: updatedState })).toEqual(updatedState);
    });
  });
});
