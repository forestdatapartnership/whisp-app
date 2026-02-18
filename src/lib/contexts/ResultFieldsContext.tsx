'use client'

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import type {
  CommodityMetadata,
  CommodityMetadataMap,
  PowerBiMetadata,
  AnalysisMetadata,
  ResultField,
  Commodity,
  ResultFieldsMap
} from '@/types/models';

export type {
  CommodityMetadata,
  CommodityMetadataMap,
  PowerBiMetadata,
  AnalysisMetadata,
  ResultField,
  Commodity,
  ResultFieldsMap
};

interface ResultFieldsContextType {
  fields: ResultFieldsMap;
  commodities: Commodity[];
  isLoading: boolean;
  getField: (fieldName: string) => ResultField | undefined;
  refresh: () => Promise<void>;
  updateField: (fieldName: string, field: ResultField) => void;
  deleteField: (fieldName: string) => void;
  addField: (field: ResultField) => void;
  addCommodity: (commodity: Commodity) => void;
  updateCommodity: (code: string, commodity: Commodity) => void;
  deleteCommodity: (code: string) => void;
}

const ResultFieldsContext = createContext<ResultFieldsContextType | undefined>(undefined);

interface ResultFieldsProviderProps {
  children: ReactNode;
}

export function ResultFieldsProvider({ children }: ResultFieldsProviderProps) {
  const [fields, setFields] = useState<ResultFieldsMap>({});
  const [commodities, setCommodities] = useState<Commodity[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async () => {
    try {
      setIsLoading(true);

      const [fieldsRes, commoditiesRes] = await Promise.all([
        fetch('/api/result-fields', { cache: 'no-store', headers: { Pragma: 'no-cache' } }),
        fetch('/api/commodities', { cache: 'no-store', headers: { Pragma: 'no-cache' } })
      ]);

      if (fieldsRes.ok) {
        const data = await fieldsRes.json();
        const items = data.data?.fields || [];
        setFields(Object.fromEntries(items.map((f: ResultField) => [f.code, f])));
      } else {
        console.error('Failed to load result fields:', fieldsRes.status);
        setFields({});
      }

      if (commoditiesRes.ok) {
        const data = await commoditiesRes.json();
        setCommodities(data.data?.commodities || []);
      } else {
        console.error('Failed to load commodities:', commoditiesRes.status);
        setCommodities([]);
      }
    } catch (err) {
      console.error('Failed to load result fields data:', err);
      setFields({});
      setCommodities([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const refresh = async () => {
    await loadData();
  };

  const updateField = (fieldName: string, field: ResultField) => {
    setFields(prev => ({
      ...prev,
      [fieldName]: field
    }));
  };

  const deleteField = (fieldName: string) => {
    setFields(prev => {
      const newFields = { ...prev };
      delete newFields[fieldName];
      return newFields;
    });
  };

  const addField = (field: ResultField) => {
    setFields(prev => ({
      ...prev,
      [field.code]: field
    }));
  };

  const addCommodity = (commodity: Commodity) => {
    setCommodities(prev => [...prev, commodity]);
  };

  const updateCommodity = (code: string, commodity: Commodity) => {
    setCommodities(prev => prev.map(c => c.code === code ? commodity : c));
  };

  const deleteCommodity = (code: string) => {
    setCommodities(prev => prev.filter(c => c.code !== code));
  };

  const getField = (fieldName: string): ResultField | undefined => {
    return fields[fieldName];
  };

  const value: ResultFieldsContextType = {
    fields,
    commodities,
    isLoading,
    getField,
    refresh,
    updateField,
    deleteField,
    addField,
    addCommodity,
    updateCommodity,
    deleteCommodity,
  };

  return (
    <ResultFieldsContext.Provider value={value}>
      {children}
    </ResultFieldsContext.Provider>
  );
}

export function useResultFields(): ResultFieldsContextType {
  const context = useContext(ResultFieldsContext);
  if (context === undefined) {
    throw new Error('useResultFields must be used within a ResultFieldsProvider');
  }
  return context;
}

