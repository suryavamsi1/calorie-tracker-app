import { act, renderHook, waitFor } from '@testing-library/react-native';
import type { ReactNode } from 'react';

import { AuthProvider, useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import { clearToken, getToken, setToken } from '@/lib/tokenStorage';

jest.mock('@/lib/api', () => ({
  api: { get: jest.fn(), post: jest.fn() },
}));

jest.mock('@/lib/tokenStorage', () => ({
  getToken: jest.fn(),
  setToken: jest.fn(),
  clearToken: jest.fn(),
}));

jest.mock('@/lib/analytics', () => ({
  track: jest.fn(),
}));

const mockUser = { id: 'user-1', email: 'user@example.com', name: 'Test User' };

function wrapper({ children }: { children: ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}

describe('AuthContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('useAuth throws when used outside an AuthProvider', () => {
    const { result } = renderHook(() => {
      try {
        return useAuth();
      } catch (err) {
        return err;
      }
    });
    expect(result.current).toBeInstanceOf(Error);
    expect((result.current as Error).message).toBe('useAuth must be used within an AuthProvider');
  });

  it('finishes loading with no user when no token is stored', async () => {
    (getToken as jest.Mock).mockResolvedValueOnce(null);

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.user).toBeNull();
    expect(api.get).not.toHaveBeenCalled();
  });

  it('loads the current user from /me when a token exists', async () => {
    (getToken as jest.Mock).mockResolvedValueOnce('existing-token');
    (api.get as jest.Mock).mockResolvedValueOnce({ user: mockUser });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.user).toEqual(mockUser);
    expect(api.get).toHaveBeenCalledWith('/me');
  });

  it('clears the token and stays logged out if /me fails for a stored token', async () => {
    (getToken as jest.Mock).mockResolvedValueOnce('stale-token');
    (api.get as jest.Mock).mockRejectedValueOnce(new Error('unauthorized'));

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.user).toBeNull();
    expect(clearToken).toHaveBeenCalled();
  });

  it('signUp posts to /signup unauthenticated, stores the token, and loads the full user', async () => {
    (getToken as jest.Mock).mockResolvedValueOnce(null);
    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    (api.post as jest.Mock).mockResolvedValueOnce({ token: 'new-token', user: { id: 'user-1', email: 'user@example.com', name: null } });
    (api.get as jest.Mock).mockResolvedValueOnce({ user: mockUser });

    await act(async () => {
      await result.current.signUp('user@example.com', 'password123', 'Test User');
    });

    expect(api.post).toHaveBeenCalledWith(
      '/signup',
      { email: 'user@example.com', password: 'password123', name: 'Test User' },
      { auth: false }
    );
    expect(setToken).toHaveBeenCalledWith('new-token');
    expect(result.current.user).toEqual(mockUser);
  });

  it('logIn posts to /login unauthenticated, stores the token, and loads the full user', async () => {
    (getToken as jest.Mock).mockResolvedValueOnce(null);
    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    (api.post as jest.Mock).mockResolvedValueOnce({ token: 'login-token', user: mockUser });
    (api.get as jest.Mock).mockResolvedValueOnce({ user: mockUser });

    await act(async () => {
      await result.current.logIn('user@example.com', 'password123');
    });

    expect(api.post).toHaveBeenCalledWith('/login', { email: 'user@example.com', password: 'password123' }, { auth: false });
    expect(setToken).toHaveBeenCalledWith('login-token');
    expect(result.current.user).toEqual(mockUser);
  });

  it('logOut clears the stored token and resets the user to null', async () => {
    (getToken as jest.Mock).mockResolvedValueOnce('existing-token');
    (api.get as jest.Mock).mockResolvedValueOnce({ user: mockUser });
    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.user).toEqual(mockUser));

    await act(async () => {
      await result.current.logOut();
    });

    expect(clearToken).toHaveBeenCalled();
    expect(result.current.user).toBeNull();
  });

  it('refreshUser re-fetches /me and updates the user', async () => {
    (getToken as jest.Mock).mockResolvedValueOnce('existing-token');
    (api.get as jest.Mock).mockResolvedValueOnce({ user: mockUser });
    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.user).toEqual(mockUser));

    const updatedUser = { ...mockUser, name: 'Updated Name' };
    (api.get as jest.Mock).mockResolvedValueOnce({ user: updatedUser });

    await act(async () => {
      await result.current.refreshUser();
    });

    expect(result.current.user).toEqual(updatedUser);
  });
});
