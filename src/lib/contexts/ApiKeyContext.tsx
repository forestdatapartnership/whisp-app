'use client'

import { createContext, useContext, useEffect, useState, useCallback, useRef, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { fetchTempApiKey, fetchUserApiKey, createUserApiKey, deleteUserApiKey } from '@/lib/auth/actions';

type ApiKeyMetadata = {
  createdAt: string | null;
  expiresAt: string | null;
};

type ApiKeyContextType = {
  apiKey: string | null;
  apiKeyMetadata: ApiKeyMetadata | null;
  hasApiKey: boolean;
  isUserKey: boolean;
  isLoading: boolean;
  error: string | null;
  createApiKey: () => Promise<{ success: boolean; apiKey?: string; error?: string }>;
  deleteApiKey: () => Promise<boolean>;
  refreshApiKey: () => Promise<void>;
  clearError: () => void;
};

const ApiKeyContext = createContext<ApiKeyContextType | undefined>(undefined);

export function ApiKeyProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [apiKeyMetadata, setApiKeyMetadata] = useState<ApiKeyMetadata | null>(null);
  const [isUserKey, setIsUserKey] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const tempKeyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadApiKey = useCallback(async () => {
    if (tempKeyTimerRef.current) {
      clearTimeout(tempKeyTimerRef.current);
      tempKeyTimerRef.current = null;
    }
    setIsLoading(true);
    setError(null);

    try {
      if (isAuthenticated) {
        const userKey = await fetchUserApiKey();
        
        if (userKey.apiKey) {
          setApiKey(userKey.apiKey);
          setIsUserKey(true);
          setApiKeyMetadata({
            createdAt: userKey.createdAt,
            expiresAt: userKey.expiresAt,
          });
        } else {
          setApiKey(null);
          setIsUserKey(false);
          setApiKeyMetadata(null);
        }
      } else {
        const tempKey = await fetchTempApiKey();
        setApiKey(tempKey.apiKey);
        setIsUserKey(false);
        setApiKeyMetadata(
          tempKey.expiresAt
            ? {
                createdAt: null,
                expiresAt: tempKey.expiresAt,
              }
            : null
        );

        if (tempKey.expiresAt) {
          const expiresTime = new Date(tempKey.expiresAt).getTime();
          if (!Number.isNaN(expiresTime)) {
            const delay = expiresTime - Date.now();
            if (delay > 0) {
              tempKeyTimerRef.current = setTimeout(() => {
                loadApiKey();
              }, delay);
            }
          }
        }
      }
    } catch (err) {
      console.error('Error loading API key:', err);
      setError('Failed to load API key');
      setApiKey(null);
      setIsUserKey(false);
      setApiKeyMetadata(null);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  const createApiKey = useCallback(async () => {
    setError(null);

    try {
      const result = await createUserApiKey();
      setApiKey(result.apiKey);
      setIsUserKey(true);
      setApiKeyMetadata({
        createdAt: result.createdAt,
        expiresAt: result.expiresAt,
      });
      return { success: true, apiKey: result.apiKey };
    } catch (err: any) {
      const errorMessage = err.message || 'An error occurred while creating API key';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  }, []);

  const deleteApiKey = useCallback(async () => {
    setError(null);

    try {
      await deleteUserApiKey();
      setApiKey(null);
      setIsUserKey(false);
      setApiKeyMetadata(null);
      return true;
    } catch (err: any) {
      const errorMessage = err.message || 'An error occurred while deleting API key';
      setError(errorMessage);
      return false;
    }
  }, []);

  const refreshApiKey = useCallback(async () => {
    await loadApiKey();
  }, [loadApiKey]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  useEffect(() => {
    return () => {
      if (tempKeyTimerRef.current) {
        clearTimeout(tempKeyTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!authLoading) {
      loadApiKey();
    }
  }, [isAuthenticated, authLoading, loadApiKey]);

  return (
    <ApiKeyContext.Provider
      value={{
        apiKey,
        apiKeyMetadata,
        hasApiKey: isUserKey && !!apiKeyMetadata,
        isUserKey,
        isLoading,
        error,
        createApiKey,
        deleteApiKey,
        refreshApiKey,
        clearError,
      }}
    >
      {children}
    </ApiKeyContext.Provider>
  );
}

export function useApiKey() {
  const context = useContext(ApiKeyContext);
  if (!context) {
    throw new Error('useApiKey must be used within ApiKeyProvider');
  }
  return context;
}

