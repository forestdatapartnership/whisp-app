'use client'

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { fetchUserProfile } from '@/lib/auth/user-actions';
import { loginUser, logoutUser } from '@/lib/auth/actions';
import { formatSystemMessage } from '@/types/systemCodes';
import type { UserProfile } from '@/types/user';

type AuthContextType = {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<boolean>;
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
    const result = await fetchUserProfile();
    const profile = result.ok ? result.data : null;
    setUser(profile);
    return profile;
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
    window.location.href = '/';
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setError(null);
    const result = await loginUser(email, password);
    if (!result.ok) {
      setError(formatSystemMessage(result.code, result.args));
      return false;
    }
    setUser(result.data);
    return true;
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
