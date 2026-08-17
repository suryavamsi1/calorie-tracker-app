import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { api } from '@/lib/api';
import { clearToken, getToken, setToken } from '@/lib/tokenStorage';
import type { User } from '@/types';

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  logIn: (email: string, password: string) => Promise<void>;
  logOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
  setUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadSession = useCallback(async () => {
    const token = await getToken();
    if (!token) {
      setIsLoading(false);
      return;
    }
    try {
      const { user: me } = await api.get<{ user: User }>('/me');
      setUserState(me);
    } catch {
      await clearToken();
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSession();
  }, [loadSession]);

  const signUp = useCallback(async (email: string, password: string, name: string) => {
    const { token, user: newUser } = await api.post<{ token: string; user: User }>(
      '/signup',
      { email, password, name },
      { auth: false }
    );
    await setToken(token);
    const { user: fullUser } = await api.get<{ user: User }>('/me');
    setUserState(fullUser ?? newUser);
  }, []);

  const logIn = useCallback(async (email: string, password: string) => {
    const { token, user: loggedInUser } = await api.post<{ token: string; user: User }>(
      '/login',
      { email, password },
      { auth: false }
    );
    await setToken(token);
    setUserState(loggedInUser);
    const { user: fullUser } = await api.get<{ user: User }>('/me');
    setUserState(fullUser);
  }, []);

  const logOut = useCallback(async () => {
    await clearToken();
    setUserState(null);
  }, []);

  const refreshUser = useCallback(async () => {
    const { user: refreshed } = await api.get<{ user: User }>('/me');
    setUserState(refreshed);
  }, []);

  const value = useMemo(
    () => ({ user, isLoading, signUp, logIn, logOut, refreshUser, setUser: setUserState }),
    [user, isLoading, signUp, logIn, logOut, refreshUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
