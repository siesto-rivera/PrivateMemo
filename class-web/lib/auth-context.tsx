'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import {
  AuthError,
  clearTokens,
  getAccess,
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
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function bootstrap() {
      if (!getAccess()) {
        if (!cancelled) setLoading(false);
        return;
      }
      try {
        const u = await apiMe();
        if (!cancelled) setUser(u);
      } catch (err) {
        if (!(err instanceof AuthError)) {
          // non-auth error (e.g. network) — leave user null
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    bootstrap();
    return () => {
      cancelled = true;
    };
  }, []);

  const signup = useCallback(async (email: string, name: string, password: string) => {
    const res = await apiSignup(email, name, password);
    setUser(res.user);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    await apiLogin(email, password);
    const u = await apiMe();
    setUser(u);
  }, []);

  const logout = useCallback(() => {
    clearTokens();
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
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
