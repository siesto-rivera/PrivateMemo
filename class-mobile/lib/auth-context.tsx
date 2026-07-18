import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import {
  AuthError,
  clearTokens,
  getAccess,
  getRefresh,
  getStoredUser,
  login as apiLogin,
  me as apiMe,
  signup as apiSignup,
} from './api';
import type { User } from './types';

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  signup: (email: string, name: string, password: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [access, refresh, cached] = await Promise.all([
          getAccess(),
          getRefresh(),
          getStoredUser(),
        ]);
        // No stored tokens at all → genuinely logged out.
        if (!access && !refresh) return;
        // Restore the cached session immediately so a slow/offline launch keeps
        // the user logged in instead of bouncing them to the login screen.
        if (cached && !cancelled) setUser(cached);
        try {
          const u = await apiMe();
          if (!cancelled) setUser(u);
        } catch (e) {
          // Only a real auth failure (401 after refresh) logs the user out.
          // Transient/network errors keep the persisted session intact.
          if (e instanceof AuthError) {
            await clearTokens();
            if (!cancelled) setUser(null);
          }
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const signup = useCallback(async (email: string, name: string, password: string) => {
    const data = await apiSignup(email, name, password);
    setUser(data.user);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    await apiLogin(email, password);
    const u = await apiMe();
    setUser(u);
  }, []);

  const logout = useCallback(async () => {
    await clearTokens();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, signup, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
