"use client"

import { createContext, useContext } from "react"
import type { Table } from "@tanstack/react-table"

const DataTableContext = createContext<{ table: Table<any> } | null>(null);

export function useDataTable<TData = any>(): Table<TData> {
  const ctx = useContext(DataTableContext);
  if (!ctx) throw new Error('useDataTable must be used within a DataTable');
  return ctx.table as Table<TData>;
}

export { DataTableContext };
