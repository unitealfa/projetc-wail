import { createContext, useCallback, useContext, useEffect, useMemo, useState, type PropsWithChildren } from 'react';
import { authApi } from '../api/auth.api';
import { registerUnauthorizedHandler } from '../api/client';
import { sessionStorage } from '../storage/sessionStorage';
import type { AuthUser } from '../types/auth';

interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (userId: string) => Promise<void>;
  logout: () => Promise<void>;
  restoreSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const logout = useCallback(async () => {
    await sessionStorage.clearToken();
    setToken(null);
    setUser(null);
  }, []);

  const restoreSession = useCallback(async () => {
    setIsLoading(true);
    try {
      const storedToken = await sessionStorage.getToken();
      if (!storedToken) return;
      setToken(storedToken);
      const result = await authApi.me();
      setUser(result.user);
    } catch {
      await sessionStorage.clearToken();
      setToken(null);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = useCallback(async (userId: string) => {
    const result = await authApi.login(userId);
    await sessionStorage.setToken(result.token);
    setToken(result.token);
    setUser(result.user);
  }, []);

  useEffect(() => {
    void restoreSession();
  }, [restoreSession]);

  useEffect(() => {
    registerUnauthorizedHandler(logout);
    return () => registerUnauthorizedHandler(null);
  }, [logout]);

  const value = useMemo<AuthContextValue>(
    () => ({ user, token, isLoading, isAuthenticated: Boolean(user && token), login, logout, restoreSession }),
    [user, token, isLoading, login, logout, restoreSession],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth doit être utilisé dans AuthProvider.');
  return context;
}
