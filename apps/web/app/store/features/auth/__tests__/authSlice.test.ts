import { describe, expect, it } from 'vitest';
import reducer, { clearUser, setLoading, setUser } from '../authSlice';

describe('authSlice', () => {
  const initialState = {
    loading: true,
    token: null,
    user: null,
  };

  it('should handle initial state', () => {
    expect(reducer(undefined, { type: 'unknown' })).toEqual(initialState);
  });

  it('should handle setUser', () => {
    const user = {
      displayName: 'Test User',
      email: 'test@example.com',
      uid: '123',
    };
    const token = 'fake-token';
    const actual = reducer(initialState, setUser({ token, user }));
    expect(actual.user).toEqual(user);
    expect(actual.token).toEqual(token);
    expect(actual.loading).toBe(false);
  });

  it('should handle clearUser', () => {
    const state = {
      loading: false,
      token: 'fake-token',
      user: {
        displayName: 'Test User',
        email: 'test@example.com',
        uid: '123',
      },
    };
    const actual = reducer(state, clearUser());
    expect(actual.user).toBeNull();
    expect(actual.token).toBeNull();
    expect(actual.loading).toBe(false);
  });

  it('should handle setLoading', () => {
    const actual = reducer(initialState, setLoading(false));
    expect(actual.loading).toBe(false);
  });
});
