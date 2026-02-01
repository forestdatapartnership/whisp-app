'use client'

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { SystemCode } from '@/types/systemCodes';

type UserProfile = {
  id: number;
  name: string;
  last_name: string;
  organization: string | null;
  email: string;
  email_verified: boolean;
  is_admin: boolean;
};

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
  const router = useRouter();

  const fetchUserProfile = useCallback(async () => {
    try {
      const statusRes = await fetch('/api/auth/status', { 
        credentials: 'include' 
      });
      
      if (statusRes.ok) {
        const status = await statusRes.json();
        const authenticated = status.code === SystemCode.AUTH_STATUS_AUTHENTICATED;
        
        if (!authenticated) {
          setUser(null);
          return null;
        }
      }

      const response = await fetch('/api/user/profile', {
        credentials: 'include',
      });
      
      if (response.ok) {
        const data = await response.json();
        const userData = data.data.user;
        setUser(userData ?? null);
        return userData;
      } else if (response.status === 401) {
        setUser(null);
        return null;
      }
    } catch (err) {
      console.error('Error fetching user profile:', err);
      setUser(null);
      return null;
    }
  }, []);

  const refreshUser = useCallback(async () => {
    setIsLoading(true);
    await fetchUserProfile();
    setIsLoading(false);
  }, [fetchUserProfile]);

  const logout = useCallback(async () => {
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'GET',
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Logout failed');
      }
      
      setUser(null);
      setError(null);
      
      window.location.href = '/';
    } catch (err) {
      console.error('Error logging out:', err);
      setError('An error occurred while logging out');
    }
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    try {
      setError(null);
      
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });

      if (response.ok) {
        await fetchUserProfile();
        return true;
      } else {
        const data = await response.json();
        setError(data.message || 'Login failed');
        return false;
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('An error occurred during login');
      return false;
    }
  }, [fetchUserProfile]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  useEffect(() => {
    fetchUserProfile().finally(() => setIsLoading(false));
  }, []);

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
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}

