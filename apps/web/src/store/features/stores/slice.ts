import type { PayloadAction } from '@reduxjs/toolkit';
import type { Store } from '@/graphql/types';
import { createAppSlice } from '@/store/createAppSlice';

export type StoreState = {
  storeId: string;
  show: boolean;
  store: Omit<Store, '__typename'>;
};

const initialState: StoreState = {
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

export const storeSlice = createAppSlice({
  initialState,
  name: 'store',
  reducers: {
    setShowStore: (state, action: PayloadAction<StoreState['show']>) => {
      state.show = action.payload;
    },
    setStore: (state, action: PayloadAction<StoreState['store']>) => {
      state.store = action.payload;
    },
    setStoreId: (
      state,
      action: PayloadAction<StoreState['store']['storeId']>,
    ) => {
      state.storeId = action.payload;
      state.store.storeId = action.payload;
    },
  },
  selectors: {
    selectStoreState: (state) => state,
  },
});

export const { setStore, setShowStore, setStoreId } = storeSlice.actions;

export const { selectStoreState } = storeSlice.selectors;
