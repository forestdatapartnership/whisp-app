'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useAuth } from '@/lib/auth/auth-context';
import { useConfig } from '@/lib/config/config-context';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Spinner } from '@/components/ui/icons';

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
  const { isLoading: configLoading } = useConfig();

  const [timedOut, setTimedOut] = useState(false);
  const [hasInitialized, setHasInitialized] = useState(false);

  const isLoading = authLoading || configLoading;

  const errors: string[] = [
    authError,
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
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background">
        <div className="text-center">
          <Spinner className="mx-auto h-10 w-10 text-accent-green" />
          <p className="mt-4 text-sm text-muted-foreground">Loading…</p>
        </div>
      </div>
    );
  }

  if (!hasInitialized && hasError) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-[400px]">
          <CardHeader>
            <CardTitle>Something went wrong</CardTitle>
            <CardDescription>We couldn&apos;t load the application.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              {errors.map((err, i) => (
                <Alert key={i} type="error" message={err} />
              ))}
            </div>
            <Button type="button" className="w-full" onClick={() => window.location.reload()}>
              Refresh page
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <AppReadyContext.Provider value={appReadyValue}>
      {children}
    </AppReadyContext.Provider>
  );
}
