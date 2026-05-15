'use client'

import { createContext, useContext, useEffect, useState, useCallback, useRef, ReactNode } from 'react';
import { useAuth } from './auth-context';
import { fetchTempApiKey, fetchUserApiKey, createUserApiKey, deleteUserApiKey } from '@/lib/auth/api-key-actions';
import { formatSystemMessage } from '@/types/systemCodes';

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
  const loadApiKeyRef = useRef<(() => Promise<void>) | undefined>(undefined);

  const clearKey = useCallback(() => {
    setApiKey(null);
    setIsUserKey(false);
    setApiKeyMetadata(null);
  }, []);

  const loadApiKey = useCallback(async () => {
    if (tempKeyTimerRef.current) {
      clearTimeout(tempKeyTimerRef.current);
      tempKeyTimerRef.current = null;
    }
    setIsLoading(true);
    setError(null);

    if (isAuthenticated) {
      const result = await fetchUserApiKey();
      if (!result.ok) {
        setError(formatSystemMessage(result.code, result.args));
        clearKey();
      } else if (result.data.apiKey) {
        setApiKey(result.data.apiKey);
        setIsUserKey(true);
        setApiKeyMetadata({ createdAt: result.data.createdAt, expiresAt: result.data.expiresAt });
      } else {
        clearKey();
      }
    } else {
      const result = await fetchTempApiKey();
      if (!result.ok) {
        setError(formatSystemMessage(result.code, result.args));
        clearKey();
      } else {
        const tempKey = result.data;
        setApiKey(tempKey.apiKey);
        setIsUserKey(false);
        setApiKeyMetadata(tempKey.expiresAt ? { createdAt: null, expiresAt: tempKey.expiresAt } : null);

        if (tempKey.expiresAt) {
          const expiresTime = new Date(tempKey.expiresAt).getTime();
          if (!Number.isNaN(expiresTime)) {
            const delay = expiresTime - Date.now();
            if (delay > 0) {
              tempKeyTimerRef.current = setTimeout(() => {
                loadApiKeyRef.current?.();
              }, delay);
            }
          }
        }
      }
    }
    setIsLoading(false);
  }, [isAuthenticated, clearKey]);

  useEffect(() => {
    loadApiKeyRef.current = loadApiKey;
  });

  const createApiKey = useCallback(async () => {
    setError(null);
    const result = await createUserApiKey();
    if (!result.ok) {
      const message = formatSystemMessage(result.code, result.args);
      setError(message);
      return { success: false, error: message };
    }
    setApiKey(result.data.apiKey);
    setIsUserKey(true);
    setApiKeyMetadata({ createdAt: result.data.createdAt, expiresAt: result.data.expiresAt });
    return { success: true, apiKey: result.data.apiKey };
  }, []);

  const deleteApiKey = useCallback(async () => {
    setError(null);
    const result = await deleteUserApiKey();
    if (!result.ok) {
      setError(formatSystemMessage(result.code, result.args));
      return false;
    }
    clearKey();
    return true;
  }, [clearKey]);

  const refreshApiKey = useCallback(async () => {
    await loadApiKey();
  }, [loadApiKey]);

  const clearError = useCallback(() => setError(null), []);

  useEffect(() => {
    return () => {
      if (tempKeyTimerRef.current) clearTimeout(tempKeyTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (!authLoading) loadApiKey();
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
  if (!context) throw new Error('useApiKey must be used within ApiKeyProvider');
  return context;
}
