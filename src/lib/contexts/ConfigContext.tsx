'use client'

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { fetchPublicConfig } from '@/lib/config/actions';
import type { PublicConfig } from '@/lib/config';

export type { PublicConfig } from '@/lib/config';

interface ConfigContextValue {
  config: PublicConfig | null;
  isLoading: boolean;
}

const ConfigContext = createContext<ConfigContextValue | undefined>(undefined);

export function ConfigProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<PublicConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchPublicConfig()
      .then(setConfig)
      .catch((err) => {
        console.warn('Failed to load runtime config:', err);
      })
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <ConfigContext.Provider value={{ config, isLoading }}>
      {children}
    </ConfigContext.Provider>
  );
}

export function useConfig() {
  const context = useContext(ConfigContext);
  if (context === undefined) {
    throw new Error('useConfig must be used within a ConfigProvider');
  }
  return context as { config: PublicConfig; isLoading: boolean };
}
