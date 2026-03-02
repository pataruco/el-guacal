import type { PayloadAction } from '@reduxjs/toolkit';
import { createSlice } from '@reduxjs/toolkit';

export interface AuthState {
  user: {
    uid: string;
    email: string | null;
    displayName: string | null;
  } | null;
  token: string | null;
  loading: boolean;
}

const initialState: AuthState = {
  loading: true,
  token: null,
  user: null,
};

export const authSlice = createSlice({
  initialState,
  name: 'auth',
  reducers: {
    clearUser: (state) => {
      state.user = null;
      state.token = null;
      state.loading = false;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setUser: (
      state,
      action: PayloadAction<{ user: AuthState['user']; token: string | null }>,
    ) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.loading = false;
    },
  },
});

export const { setUser, clearUser, setLoading } = authSlice.actions;

export default authSlice.reducer;
