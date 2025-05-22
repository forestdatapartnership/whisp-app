"use client"
 
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
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
 
interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[] | import('geojson').FeatureCollection
}
 
export function DataTable<TData, TValue>({
  columns,
  data,
}: DataTableProps<TData, TValue>) {
  // Process FeatureCollection to array if needed
  const processedData = React.useMemo(() => {
    if (!data) return [];
    
    // Check if data is a FeatureCollection
    if (typeof data === 'object' && data !== null && 
        'type' in data && data.type === 'FeatureCollection' && 
        'features' in data && Array.isArray(data.features)) {
      // Transform FeatureCollection features to a data array
      return data.features.map((feature: any) => ({
        ...feature.properties,
        geometry: feature.geometry
      })) as TData[];
    }
    
    return data as TData[];
  }, [data]);
  
  const table = useReactTable({
    data: processedData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      columnVisibility: {
        geojson: false,
        geometry: false,
        external_id: false,
        geoid: false
      }
    }
  });

  const truncateString = (str: string) => {
    const limit = 20;
    if (str.length > limit) {
      return str.slice(0, limit) + '…';
    } else {
      return str;
    }
  };

  const formatValue = (column: string, value: any) => {
    // Handle null/undefined values
    if (value === null || value === undefined) {
        return 'na';
    }
    
    // Handle objects (any type)
    if (typeof value === 'object') {
        try {
            // Handle geometry data (either from geojson or geometry field)
            if (column === 'geojson' || column === 'geometry' || 
                (value.type && (value.coordinates || value.geometries))) {
                return `[${value.type} Geometry]`;
            }
            
            // Handle Date objects
            if (value instanceof Date) {
                return value.toISOString();
            }
            
            // Handle Arrays
            if (Array.isArray(value)) {
                if (value.length === 0) return '[]';
                if (value.length > 3) {
                    return `[${value.slice(0, 3).join(', ')}... +${value.length - 3} more]`;
                }
                return `[${value.join(', ')}]`;
            }
            
            // For any other object, stringify
            return JSON.stringify(value);
        } catch (error) {
            // Fallback for objects that can't be stringified
            return '[Complex Object]';
        }
    }
    
    // Handle primitive types
    if (typeof value === 'boolean') {
        return value ? 'true' : 'false';
    } else if (typeof value === 'number') {
        return new Intl.NumberFormat('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(value);
    } else if (column === 'geoid' || column === 'WDPA') {
        return typeof value === 'string' && value.trim().length > 0 ? truncateString(value) : 'na';
    }
    
    // Default: return as is (for strings and other primitives)
    return value;
  };

  return (
    <div>
        <DataTableViewOptions table={table} />
        <div className="overflow-x-auto">
        <Table className="min-w-full text-sm divide-y">
            <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                    return (
                    <TableHead key={header.id} className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                        {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                            )}
                    </TableHead>
                    )
                })}
                </TableRow>
            ))}
            </TableHeader>
            <TableBody>
            {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                    {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="px-6 py-4 whitespace-nowrap">
                        {formatValue(cell.column.id, cell.getValue())}
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
