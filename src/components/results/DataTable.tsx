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
 
interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
}
 
export function DataTable<TData, TValue>({
  columns,
  data,
}: DataTableProps<TData, TValue>) {  
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      columnVisibility: {
        geojson: false,
        Centroid_lat: false,
        Centroid_lon: false,
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
        if (typeof value === 'boolean') {
            return value ? 'true' : 'false';
        } else if (typeof value === 'number') {
            return new Intl.NumberFormat('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(value);
        } else if (column === 'geoid' || column === 'WDPA') {
            return typeof value === 'string' && value.trim().length > 0 ? truncateString(value) : 'na';
        }
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
                        {/* TODO: use column definitions to format cells */}
                        {/* {flexRender(cell.column.columnDef.cell, cell.getContext())} */}
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
