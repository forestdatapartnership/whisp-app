'use client'

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { fetchUserProfile } from '@/lib/auth/user-actions';
import { loginUser, logoutUser } from '@/lib/auth/actions';
import { formatSystemMessage, type SystemCode } from '@/types/system-codes';
import type { UserProfile } from '@/types/user';

type AuthContextType = {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<{ ok: boolean; code?: SystemCode }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  clearError: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadUserProfile = useCallback(async () => {
    let result = await fetchUserProfile();
    for (let attempt = 0; !result.ok && attempt < 2; attempt++) {
      await new Promise((resolve) => setTimeout(resolve, 500 * (attempt + 1)));
      result = await fetchUserProfile();
    }

    if (!result.ok) {
      // Not "unauthenticated" (that's ok:true, data:null) - a real failure, so don't log the user out.
      setError(formatSystemMessage(result.code, result.args));
      return null;
    }

    setError(null);
    setUser(result.data);
    return result.data;
  }, []);

  const refreshUser = useCallback(async () => {
    setIsLoading(true);
    await loadUserProfile();
    setIsLoading(false);
  }, [loadUserProfile]);

  const logout = useCallback(async () => {
    const result = await logoutUser();
    if (!result.ok) {
      setError(formatSystemMessage(result.code, result.args));
      return;
    }
    setUser(null);
    setError(null);
    window.location.href = '/auth/sso/logout';
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setError(null);
    const result = await loginUser(email, password);
    if (!result.ok) {
      setError(formatSystemMessage(result.code, result.args));
      return { ok: false, code: result.code };
    }
    setUser(result.data);
    return { ok: true };
  }, []);

  const clearError = useCallback(() => setError(null), []);

  useEffect(() => {
    loadUserProfile().finally(() => setIsLoading(false));
  }, [loadUserProfile]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isAdmin: user?.is_admin || false,
        isLoading,
        error,
        login,
        logout,
        refreshUser,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
