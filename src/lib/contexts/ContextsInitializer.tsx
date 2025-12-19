'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { useApiKey } from './ApiKeyContext';
import { useConfig } from './ConfigContext';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Icons';

const INIT_TIMEOUT_MS = 15000;

interface AppReadyContextType {
  isReady: boolean;
  hasError: boolean;
  errors: string[];
}

const AppReadyContext = createContext<AppReadyContextType>({
  isReady: false,
  hasError: false,
  errors: [],
});

export const useAppReady = () => useContext(AppReadyContext);

interface ContextsInitializerProps {
  children: ReactNode;
}

export function ContextsInitializer({ children }: ContextsInitializerProps) {
  const { isLoading: authLoading, error: authError } = useAuth();
  const { isLoading: apiKeyLoading, error: apiKeyError } = useApiKey();
  const { isLoading: configLoading } = useConfig();
  
  const [timedOut, setTimedOut] = useState(false);
  const [hasInitialized, setHasInitialized] = useState(false);

  const isLoading = authLoading || apiKeyLoading || configLoading;
  
  const errors: string[] = [
    authError,
    apiKeyError,
    timedOut ? 'Initialization timed out. Please refresh the page.' : null,
  ].filter((e): e is string => e !== null);
  
  const hasError = errors.length > 0;

  useEffect(() => {
    if (!isLoading) {
      setTimedOut(false);
      return;
    }

    const timeout = setTimeout(() => {
      if (isLoading) {
        setTimedOut(true);
      }
    }, INIT_TIMEOUT_MS);

    return () => clearTimeout(timeout);
  }, [isLoading]);

  useEffect(() => {
    if (!isLoading && !hasError) {
      setHasInitialized(true);
    }
  }, [isLoading, hasError]);

  const appReadyValue: AppReadyContextType = {
    isReady: !isLoading && !hasError,
    hasError,
    errors,
  };

  const shouldBlockInitialLoad = !hasInitialized && isLoading && !timedOut;

  if (shouldBlockInitialLoad) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0b3d0b]">
        <div className="text-center">
          <Spinner className="h-12 w-12 text-white mx-auto" />
          <p className="mt-4 text-white">Loading...</p>
        </div>
      </div>
    );
  }

  if (!hasInitialized && hasError) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0b3d0b] p-4">
        <div className="p-4 bg-gray-800 rounded shadow-md border border-gray-300 max-w-md w-full">
          <div className="text-center py-8">
            <h1 className="text-2xl font-semibold text-white mb-4">Error</h1>
            <div className="text-gray-300 mb-6 space-y-1">
              {errors.map((err, i) => (
                <p key={i}>{err}</p>
              ))}
            </div>
            <Button
              variant="secondary"
              onClick={() => window.location.reload()}
              className="bg-gray-600 hover:bg-gray-700 text-white"
            >
              Refresh Page
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <AppReadyContext.Provider value={appReadyValue}>
      {children}
    </AppReadyContext.Provider>
  );
}
