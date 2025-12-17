'use client'

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { fetchTempApiKey, fetchUserApiKey } from '@/lib/secureApiUtils';

type ApiKeyMetadata = {
  id: number;
  userId: number;
  createdAt: string;
  expiresAt: string | null;
  revoked: boolean;
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
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadApiKey = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      if (isAuthenticated) {
        const userKey = await fetchUserApiKey();
        
        if (userKey) {
          setApiKey(userKey);
          setIsUserKey(true);
          
          const response = await fetch('/api/user/api-key/metadata', {
            credentials: 'include',
          });
          
          if (response.ok) {
            const data = await response.json();
            if (data.hasKey) {
              setApiKeyMetadata(data.metadata);
            }
          }
        } else {
          setApiKey(null);
          setIsUserKey(false);
          setApiKeyMetadata(null);
        }
      } else {
        const tempKey = await fetchTempApiKey('ApiKeyContext');
        setApiKey(tempKey);
        setIsUserKey(false);
        setApiKeyMetadata(null);
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
      const response = await fetch('/api/user/api-key', {
        method: 'POST',
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        const newKey = data.data.apiKey;
        
        setApiKey(newKey);
        setIsUserKey(true);
        
        await loadApiKey();
        
        return {
          success: true,
          apiKey: newKey,
        };
      } else {
        const data = await response.json();
        const errorMessage = data.message || 'Failed to create API key';
        setError(errorMessage);
        return {
          success: false,
          error: errorMessage,
        };
      }
    } catch (err: any) {
      const errorMessage = err.message || 'An error occurred while creating API key';
      setError(errorMessage);
      return {
        success: false,
        error: errorMessage,
      };
    }
  }, [loadApiKey]);

  const deleteApiKey = useCallback(async () => {
    setError(null);

    try {
      const response = await fetch('/api/user/api-key', {
        method: 'DELETE',
        credentials: 'include',
      });

      if (response.ok) {
        setApiKey(null);
        setIsUserKey(false);
        setApiKeyMetadata(null);
        return true;
      } else {
        const data = await response.json();
        throw new Error(data.message || 'Failed to delete API key');
      }
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
    if (!authLoading) {
      loadApiKey();
    }
  }, [isAuthenticated, authLoading, loadApiKey]);

  return (
    <ApiKeyContext.Provider
      value={{
        apiKey,
        apiKeyMetadata,
        hasApiKey: !!apiKeyMetadata,
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

