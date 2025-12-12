"use client"

import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
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
import { DataTableViewOptions } from "./DataTableViewOptions"
import React from "react"
import { processGeoJSONData, RecordData } from "@/lib/utils/geojsonUtils"
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react"
import { formatDateTime, formatAnalysisCellValue, truncateString } from "@/lib/utils/formatters"
 
interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[] | import('geojson').FeatureCollection
  onRowClick?: (rowIndex: number) => void
  selectedRowIndex?: number
  showExternalIdByDefault?: boolean
  defaultSortColumnId?: string
}
 
export function DataTable<TData, TValue>({
  columns,
  data,
  onRowClick,
  selectedRowIndex,
  showExternalIdByDefault = false,
  defaultSortColumnId
}: DataTableProps<TData, TValue>) {
  // Process FeatureCollection to array if needed
  const processedData = React.useMemo(() => {
    if (!data) return [];

    // Check if data is a FeatureCollection
    if (typeof data === 'object' && data !== null &&
        'type' in data && data.type === 'FeatureCollection' &&
        'features' in data && Array.isArray(data.features)) {
      // Use the unified processing function
      return processGeoJSONData(data) as TData[];
    }

    return data as TData[];
  }, [data]);
  
  const [sorting, setSorting] = React.useState<SortingState>(
    defaultSortColumnId ? [{
      id: defaultSortColumnId,
      desc: false
    }] : []
  );
  
  const table = useReactTable({
    data: processedData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    state: {
      sorting
    },
    initialState: {
      columnVisibility: {
        external_id: showExternalIdByDefault,
        geoid: false
      }
    }
  });

  return (
    <div>
        <DataTableViewOptions table={table} />
        <div className="overflow-x-auto">
        <Table className="min-w-full text-sm divide-y">
            <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                    <TableHead 
                      key={header.id} 
                      onClick={header.column.getToggleSortingHandler()}
                      className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer select-none hover:text-gray-300"
                    >
                      <div className="flex items-center gap-2">
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {header.column.getIsSorted() === 'asc' ? (
                          <ArrowUp className="h-4 w-4" />
                        ) : header.column.getIsSorted() === 'desc' ? (
                          <ArrowDown className="h-4 w-4" />
                        ) : (
                          <ArrowUpDown className="h-4 w-4 opacity-50" />
                        )}
                      </div>
                    </TableHead>
                ))}
                </TableRow>
            ))}
            </TableHeader>
            <TableBody>
            {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} 
                    onClick={() => onRowClick?.(row.index)} 
                    className={`cursor-pointer hover:bg-gray-700 ${selectedRowIndex === row.index ? 'bg-blue-900 bg-opacity-50' : ''}`}>
                    {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="px-6 py-4 whitespace-nowrap">
                        {formatAnalysisCellValue(cell.column.id, cell.getValue())}
                    </TableCell>
                    ))}
                </TableRow>
                ))
            ) : (
                <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                    No results.
                </TableCell>
                </TableRow>
            )}
            </TableBody>
        </Table>
        </div>
        <DataTablePagination table={table} />
    </div>
  )
}
