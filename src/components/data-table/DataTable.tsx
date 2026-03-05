"use client"

import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
} from "@tanstack/react-table"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/Table"
import { DataTablePagination } from "./DataTablePagination"
import { DataTableToolbar } from "./DataTableToolbar"
import { DataTableContext } from "./DataTableContext"
import { useState, useMemo, useEffect } from "react"
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react"
import type { ReactNode } from "react"

const SEARCH_DEBOUNCE_MS = 200;

export interface DataTableProps<TData> {
  columns: ColumnDef<TData, any>[]
  data: TData[]
  onRowClick?: (rowIndex: number) => void
  selectedRowIndex?: number
  initialColumnVisibility?: Record<string, boolean>
  defaultSortColumnId?: string
  formatCellValue?: (columnId: string, value: unknown) => ReactNode
  title?: string
  searchFields?: string[]
  toolbarActions?: ReactNode
  children?: ReactNode
  emptyMessage?: string
  noMatchMessage?: string
}

export function DataTable<TData>({
  columns,
  data,
  onRowClick,
  selectedRowIndex,
  initialColumnVisibility,
  defaultSortColumnId,
  formatCellValue,
  title,
  searchFields,
  toolbarActions,
  children,
  emptyMessage = 'No results.',
  noMatchMessage = 'No results match your search.',
}: DataTableProps<TData>) {
  const hasCardWrapper = !!title;

  const hasSearch = !!searchFields?.length;
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedFilter, setDebouncedFilter] = useState('');
  useEffect(() => {
    const t = setTimeout(() => setDebouncedFilter(searchTerm), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [searchTerm]);

  const [sorting, setSorting] = useState<SortingState>(
    defaultSortColumnId ? [{
      id: defaultSortColumnId,
      desc: false
    }] : []
  );
  
  const defaultVisibility = useMemo(() => {
    const visibility: Record<string, boolean> = {};
    columns.forEach((col) => {
      const key = 'accessorKey' in col ? col.accessorKey as string : undefined;
      if (key) {
        const meta = col.meta as any;
        if (meta?.metadata?.visibleByDefault === false) {
          visibility[key] = false;
        }
      }
    });
    return { ...visibility, ...initialColumnVisibility };
  }, [columns, initialColumnVisibility]);

  const globalFilterFn = (row: import("@tanstack/react-table").Row<TData>, _columnId: string, filterValue: string) => {
    if (!searchFields?.length || !filterValue) return true;
    const search = filterValue.toLowerCase();
    return searchFields.some((field) => {
      const value = row.getValue(field);
      return value != null && String(value).toLowerCase().includes(search);
    });
  };

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    globalFilterFn,
    state: {
      sorting,
      globalFilter: debouncedFilter,
    },
    initialState: {
      columnVisibility: defaultVisibility
    }
  });

  const totalRows = data.length;
  const filteredRows = table.getFilteredRowModel().rows.length;

  return (
    <DataTableContext.Provider value={{ table }}>
    <div className={hasCardWrapper ? 'bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-700' : undefined}>
        <DataTableToolbar
          title={title}
          searchTerm={hasSearch ? searchTerm : undefined}
          onSearchChange={hasSearch ? setSearchTerm : undefined}
          searchPlaceholder={hasSearch ? `Search by ${searchFields!.join(', ')}` : ''}
        >
          {toolbarActions}
        </DataTableToolbar>

        {totalRows > 0 && filteredRows === 0 ? (
          <p className="text-gray-400 py-4">{noMatchMessage}</p>
        ) : totalRows === 0 && hasCardWrapper ? (
          <p className="text-gray-400 py-4">{emptyMessage}</p>
        ) : (
          <>
            <div className="overflow-x-auto">
            <Table className={hasCardWrapper ? 'text-xs' : 'min-w-full text-sm divide-y'}>
                <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                    <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => {
                      const meta = header.column.columnDef.meta as any;
                      const tooltipText = meta 
                        ? [
                            meta.description,
                            meta.period && `Period: ${meta.period}`,
                            meta.source && `Source: ${meta.source}`
                          ].filter(Boolean).join('\n')
                        : undefined;
                      
                      const isSortable = header.column.getCanSort();
                      
                      return (
                        <TableHead 
                          key={header.id} 
                          onClick={isSortable ? header.column.getToggleSortingHandler() : undefined}
                          className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isSortable ? 'cursor-pointer select-none hover:text-gray-300' : ''}`}
                          title={tooltipText}
                        >
                          <div className="flex items-center gap-2">
                            {flexRender(header.column.columnDef.header, header.getContext())}
                            {isSortable && (
                              header.column.getIsSorted() === 'asc' ? (
                                <ArrowUp className="h-4 w-4" />
                              ) : header.column.getIsSorted() === 'desc' ? (
                                <ArrowDown className="h-4 w-4" />
                              ) : (
                                <ArrowUpDown className="h-4 w-4 opacity-50" />
                              )
                            )}
                          </div>
                        </TableHead>
                      );
                    })}
                    </TableRow>
                ))}
                </TableHeader>
                <TableBody>
                {table.getRowModel().rows.length ? (
                    table.getRowModel().rows.map((row) => (
                    <TableRow key={row.id} 
                        onClick={() => onRowClick?.(row.index)} 
                        className={`${onRowClick ? 'cursor-pointer' : ''} hover:bg-gray-700 ${selectedRowIndex === row.index ? 'bg-blue-900 bg-opacity-50' : ''}`}>
                        {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id} className="px-6 py-4 whitespace-nowrap">
                            {formatCellValue
                              ? formatCellValue(cell.column.id, cell.getValue())
                              : flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                        ))}
                    </TableRow>
                    ))
                ) : (
                    <TableRow>
                    <TableCell colSpan={columns.length} className="h-24 text-center">
                        {emptyMessage}
                    </TableCell>
                    </TableRow>
                )}
                </TableBody>
            </Table>
            </div>
            <DataTablePagination table={table} />
          </>
        )}

        {children}
    </div>
    </DataTableContext.Provider>
  )
}
