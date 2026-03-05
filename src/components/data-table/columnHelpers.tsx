import { formatDateTime } from '@/lib/utils/formatters';
import type { ColumnDef } from '@tanstack/react-table';
import type { AuditedModel } from '@/types/models';

export function codeColumn<T>(key: keyof T & string, header: string): ColumnDef<T, unknown> {
  return {
    accessorKey: key,
    header,
    meta: { className: 'w-[180px]' },
    cell: ({ getValue }) => (
      <span className="font-mono text-gray-100 max-w-[180px] truncate block" title={getValue() as string ?? undefined}>
        {getValue() as string}
      </span>
    ),
  };
}

export function textColumn<T>(key: keyof T & string, header: string): ColumnDef<T, unknown> {
  return {
    accessorKey: key,
    header,
    cell: ({ getValue }) => (
      <span className="text-gray-200">{(getValue() as string | number) ?? '\u2014'}</span>
    ),
  };
}

export function truncatedTextColumn<T>(key: keyof T & string, header: string): ColumnDef<T, unknown> {
  return {
    accessorKey: key,
    header,
    cell: ({ getValue }) => (
      <span className="block truncate text-gray-200 max-w-[200px]" title={getValue() as string ?? undefined}>
        {(getValue() as string) ?? '\u2014'}
      </span>
    ),
  };
}

export function lastModifiedColumn<T extends AuditedModel>(): ColumnDef<T, unknown> {
  return {
    accessorKey: 'updatedAt',
    header: 'Last modified',
    cell: ({ row }) => (
      <span className="text-gray-400" title={row.original.updatedBy ? `by ${row.original.updatedBy}` : undefined}>
        {formatDateTime(row.original.updatedAt)}
      </span>
    ),
  };
}
