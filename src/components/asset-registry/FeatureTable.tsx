'use client';

import type { ReactNode } from 'react';
import type { FeatureCollection } from 'geojson';
import type { ColumnDef } from '@tanstack/react-table';
import { PlotData } from '@/components/plots/PlotData';
import { formatColumnName } from '@/lib/analysis/formatters';

export function summarizeProperties(props: Record<string, unknown> | null | undefined): string {
  if (!props) return '';
  return Object.entries(props)
    .filter(([, v]) => v != null && v !== '' && typeof v !== 'object')
    .map(([k, v]) => `${k}: ${v}`)
    .join(', ');
}

export interface FeatureRow {
  index: number;
  geoId: string;
  geometryType: string;
  properties: string;
  status: 'pending' | 'created' | 'error' | 'retrieved';
  error?: string;
}

const columns: ColumnDef<FeatureRow, any>[] = [
  { accessorKey: 'index', header: formatColumnName('plotId'), cell: ({ getValue }) => getValue<number>() + 1 },
  { accessorKey: 'geoId', header: formatColumnName('geoId') },
  { accessorKey: 'geometryType', header: formatColumnName('geometryType') },
  { accessorKey: 'properties', header: formatColumnName('properties') },
  {
    accessorKey: 'status',
    header: formatColumnName('status'),
    cell: ({ getValue }) => {
      const status = getValue<string>();
      const color =
        status === 'created' || status === 'retrieved'
          ? 'text-green-400'
          : status === 'error'
            ? 'text-red-400'
            : 'text-gray-400';
      return <span className={color}>{status}</span>;
    },
  },
  { accessorKey: 'error', header: formatColumnName('error'), enableHiding: true },
];

const defaultColumnVisibility = { error: false };

interface FeatureTableProps {
  rows: FeatureRow[];
  geoJsonData: FeatureCollection;
  toolbarActions?: ReactNode;
  showErrors?: boolean;
}

export default function FeatureTable({ rows, geoJsonData, toolbarActions, showErrors }: FeatureTableProps) {
  return (
    <PlotData
      columns={columns}
      data={rows}
      geoJsonData={geoJsonData}
      initialColumnVisibility={showErrors ? undefined : defaultColumnVisibility}
      searchFields={['geoId', 'properties']}
      defaultShowMap={false}
      toolbarActions={toolbarActions}
    />
  );
}
