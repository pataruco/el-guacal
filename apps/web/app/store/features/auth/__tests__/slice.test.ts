import { describe, expect, it } from 'vitest';
import reducer, { clearAuth, selectAuth, setAuth } from '../slice';

describe('auth slice', () => {
  const initialState = {
    idToken: null,
    isAuthenticated: false,
    user: null,
  };

  it('should handle initial state', () => {
    expect(reducer(undefined, { type: 'unknown' })).toEqual(initialState);
  });

  it('should handle setAuth', () => {
    const user = {
      displayName: 'Test User',
      email: 'test@example.com',
      photoURL: 'https://example.com/photo.jpg',
      uid: '123',
    };
    const idToken = 'fake-token';
    const actual = reducer(initialState, setAuth({ idToken, user }));
    expect(actual.idToken).toBe(idToken);
    expect(actual.isAuthenticated).toBe(true);
    expect(actual.user).toEqual(user);
  });

  it('should handle clearAuth', () => {
    const authenticatedState = {
      idToken: 'fake-token',
      isAuthenticated: true,
      user: {
        displayName: 'Test User',
        email: 'test@example.com',
        photoURL: null,
        uid: '123',
      },
    };
    const actual = reducer(authenticatedState, clearAuth());
    expect(actual.idToken).toBeNull();
    expect(actual.isAuthenticated).toBe(false);
    expect(actual.user).toBeNull();
  });

  it('should select auth state', () => {
    const state = {
      auth: {
        idToken: 'token',
        isAuthenticated: true,
        user: {
          displayName: 'Test',
          email: 'test@example.com',
          photoURL: null,
          uid: '1',
        },
      },
    };
    expect(selectAuth(state)).toBe(state.auth);
  });
});
