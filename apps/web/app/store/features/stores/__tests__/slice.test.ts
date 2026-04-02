import { describe, expect, it } from 'vitest';
import reducer, { setShowStore, setStore, setStoreId } from '../slice';

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
});
