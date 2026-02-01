'use client'

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';

export interface CropMetadata {
  used_for_risk?: string;
  data_theme?: string;
}

export interface CropMetadataMap {
  pcrop?: CropMetadata;
  acrop?: CropMetadata;
  timber?: CropMetadata;
  [key: string]: CropMetadata | undefined;
}

export interface ResultColumn {
  columnName: string;
  type?: string;
  unit?: string;
  description?: string;
  period?: string;
  source?: string;
  dashboard?: string;
  cropMetadata?: CropMetadataMap;
  comments?: string;
  updatedAt?: Date;
  updatedBy?: string;
}

export type ResultColumnsMap = Record<string, ResultColumn>;

interface ResultColumnsContextType {
  columns: ResultColumnsMap;
  isLoading: boolean;
  getColumn: (columnName: string) => ResultColumn | undefined;
  refresh: () => Promise<void>;
  updateColumn: (columnName: string, column: ResultColumn) => void;
  deleteColumn: (columnName: string) => void;
  addColumn: (column: ResultColumn) => void;
}

const ResultColumnsContext = createContext<ResultColumnsContextType | undefined>(undefined);

interface ResultColumnsProviderProps {
  children: ReactNode;
}

export function ResultColumnsProvider({ children }: ResultColumnsProviderProps) {
  const [columns, setColumns] = useState<ResultColumnsMap>({});
  const [isLoading, setIsLoading] = useState(true);

  const loadResultColumns = async () => {
    try {
      setIsLoading(true);
      
      const response = await fetch('/api/admin/result-columns');
      
      if (!response.ok) {
        console.error('Failed to load result columns:', response.status);
        setColumns({});
        return;
      }
      
      const data = await response.json();
      const columnsData = data.data?.columns || {};
      setColumns(columnsData);
    } catch (err) {
      console.error('Failed to load result columns:', err);
      setColumns({});
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadResultColumns();
  }, []);

  const refresh = async () => {
    await loadResultColumns();
  };

  const updateColumn = (columnName: string, column: ResultColumn) => {
    setColumns(prev => ({
      ...prev,
      [columnName]: column
    }));
  };

  const deleteColumn = (columnName: string) => {
    setColumns(prev => {
      const newColumns = { ...prev };
      delete newColumns[columnName];
      return newColumns;
    });
  };

  const addColumn = (column: ResultColumn) => {
    setColumns(prev => ({
      ...prev,
      [column.columnName]: column
    }));
  };

  const getColumn = (columnName: string): ResultColumn | undefined => {
    return columns[columnName];
  };

  const value: ResultColumnsContextType = {
    columns,
    isLoading,
    getColumn,
    refresh,
    updateColumn,
    deleteColumn,
    addColumn,
  };

  return (
    <ResultColumnsContext.Provider value={value}>
      {children}
    </ResultColumnsContext.Provider>
  );
}

export function useResultColumns(): ResultColumnsContextType {
  const context = useContext(ResultColumnsContext);
  if (context === undefined) {
    throw new Error('useResultColumns must be used within a ResultColumnsProvider');
  }
  return context;
}
