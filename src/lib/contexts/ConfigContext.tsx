'use client'

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';

// Generic hashtable for all NEXT_PUBLIC_* environment variables
export type PublicConfig = Record<string, string | undefined>;

interface ConfigContextType {
  config: PublicConfig;
  isLoading: boolean;
  getConfigValue: (key: string) => string | undefined;
}

const ConfigContext = createContext<ConfigContextType | undefined>(undefined);

interface ConfigProviderProps {
  children: ReactNode;
}

export function ConfigProvider({ children }: ConfigProviderProps) {
  const [config, setConfig] = useState<PublicConfig>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadConfig = async () => {
      try {
        setIsLoading(true);
        
        const response = await fetch('/api/config');
        
        if (!response.ok) {
          throw new Error(`Failed to load config: ${response.status}`);
        }
        
        const configData = await response.json();
        setConfig(configData);
      } catch (err) {
        console.warn('Failed to load runtime config, falling back to build-time config:', err);
        
        // Fallback to build-time environment variables (dynamically collect all NEXT_PUBLIC_*)
        const fallbackConfig: PublicConfig = Object.fromEntries(
          Object.entries(process.env).filter(([key]) => key.startsWith('NEXT_PUBLIC_'))
        );
        
        setConfig(fallbackConfig);
      } finally {
        setIsLoading(false);
      }
    };

    loadConfig();
  }, []);

  const getConfigValue = (key: string): string | undefined => {
    return config[key];
  };

  const value: ConfigContextType = {
    config,
    isLoading,
    getConfigValue,
  };

  return (
    <ConfigContext.Provider value={value}>
      {children}
    </ConfigContext.Provider>
  );
}

export function useConfig(): ConfigContextType {
  const context = useContext(ConfigContext);
  if (context === undefined) {
    throw new Error('useConfig must be used within a ConfigProvider');
  }
  return context;
}
