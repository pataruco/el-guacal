import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

interface AuthState {
  idToken: string | null;
  isAuthenticated: boolean;
  user: {
    email: string | null;
    displayName: string | null;
    photoURL: string | null;
    uid: string;
  } | null;
}

const initialState: AuthState = {
  idToken: null,
  isAuthenticated: false,
  user: null,
};

const authSlice = createSlice({
  initialState,
  name: 'auth',
  reducers: {
    clearAuth: (state) => {
      state.idToken = null;
      state.isAuthenticated = false;
      state.user = null;
    },
    setAuth: (
      state,
      action: PayloadAction<{
        idToken: string;
        user: AuthState['user'];
      }>,
    ) => {
      state.idToken = action.payload.idToken;
      state.isAuthenticated = true;
      state.user = action.payload.user;
    },
  },
});

export const { setAuth, clearAuth } = authSlice.actions;
export const selectAuth = (state: { auth: AuthState }) => state.auth;
export default authSlice.reducer;
