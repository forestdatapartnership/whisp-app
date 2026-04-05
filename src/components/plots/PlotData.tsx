'use client'

import { useState } from 'react';
import dynamic from 'next/dynamic';
import type { FeatureCollection } from 'geojson';
import type { ColumnDef } from '@tanstack/react-table';
import type { ReactNode } from 'react';
import { DataTable } from '@/components/data-table/DataTable';

const PlotMapView = dynamic(() => import('@/components/plots/PlotMapView'), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full bg-gray-700 rounded-lg flex items-center justify-center">
      <div className="text-white">Loading map...</div>
    </div>
  ),
});

export interface PlotDataProps<TData> {
  columns: ColumnDef<TData, any>[];
  data: TData[];
  geoJsonData: FeatureCollection;
  initialColumnVisibility?: Record<string, boolean>;
  defaultSortColumnId?: string;
  formatCellValue?: (columnId: string, value: unknown) => ReactNode;
  searchFields?: string[];
  toolbarActions?: ReactNode;
  defaultShowMap?: boolean;
  mapHeight?: string;
}

export function PlotData<TData>({
  columns,
  data,
  geoJsonData,
  initialColumnVisibility,
  defaultSortColumnId,
  formatCellValue,
  searchFields,
  toolbarActions,
  defaultShowMap = true,
  mapHeight = 'h-96 lg:h-[600px]',
}: PlotDataProps<TData>) {
  const [showMap, setShowMap] = useState(defaultShowMap);
  const [selectedRowIndex, setSelectedRowIndex] = useState<number | undefined>(undefined);

  return (
    <>
      <div className="flex justify-center my-4">
        <label className="flex items-center gap-2 text-white cursor-pointer">
          <input
            type="checkbox"
            checked={showMap}
            onChange={(e) => setShowMap(e.target.checked)}
            className="h-4 w-4 rounded border-gray-600 bg-gray-700 text-blue-600 focus:ring-blue-500"
          />
          <span className="text-sm font-medium">Map View</span>
        </label>
      </div>

      <div className={showMap ? 'flex flex-col lg:flex-row gap-4' : ''}>
        <div className={showMap ? 'lg:w-1/2' : 'w-full'}>
          <DataTable
            columns={columns}
            data={data}
            onRowClick={(rowIndex) => setSelectedRowIndex(rowIndex)}
            selectedRowIndex={selectedRowIndex}
            initialColumnVisibility={initialColumnVisibility}
            defaultSortColumnId={defaultSortColumnId}
            formatCellValue={formatCellValue}
            searchFields={searchFields}
            toolbarActions={toolbarActions}
          />
        </div>

        {showMap && (
          <div className={`lg:w-1/2 ${mapHeight}`}>
            <PlotMapView
              geoJsonData={geoJsonData}
              selectedFeatureIndex={selectedRowIndex}
              onFeatureClick={(featureIndex) => setSelectedRowIndex(featureIndex)}
            />
          </div>
        )}
      </div>
    </>
  );
}
