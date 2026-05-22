'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { fetchPublicConfig, type ClientConfig } from '@/lib/config/actions';

interface ConfigContextValue {
  config: ClientConfig | null;
  isLoading: boolean;
}

const ConfigContext = createContext<ConfigContextValue | undefined>(undefined);

export function ConfigProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<ClientConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchPublicConfig()
      .then((result) => {
        if (result.ok) setConfig(result.data);
        else console.warn('Failed to load runtime config:', result.code);
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
  return context as { config: ClientConfig; isLoading: boolean };
}
