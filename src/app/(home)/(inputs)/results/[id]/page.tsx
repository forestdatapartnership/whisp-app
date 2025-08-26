'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import StatusCard from '@/components/StatusCard'
import { useStatusPolling } from '@/lib/hooks/useStatusPolling'
import { DownloadDropdown } from "@/components/results/DownloadDropdown";
import { DataTable } from "@/components/results/DataTable"
import { useStore } from "@/store";
import './styles.css'
import { ColumnDef } from '@tanstack/react-table'
import dynamic from 'next/dynamic';
import { FeatureCollection } from 'geojson';
import { validateAndProcessGeoJSON, RecordData } from '@/lib/utils/geojsonUtils';

// Dynamically import MapView with no SSR to avoid window undefined error
const MapView = dynamic(() => import("@/components/results/MapView"), {
  ssr: false,
  loading: () => <div className="h-full w-full bg-gray-700 rounded-lg flex items-center justify-center">
      <div className="text-white">Loading map...</div>
  </div>
});

export default function ResultsPage() {
  const { id } = useParams<{ id: string }>()
  const [tableData, setTableData] = useState<RecordData[]>([]);
  const [columns, setColumns] = useState<ColumnDef<RecordData, any>[]>([]);
  const [showMap, setShowMap] = useState<boolean>(false);
  const [geoJsonData, setGeoJsonData] = useState<FeatureCollection | null>(null);
  const [selectedRowIndex, setSelectedRowIndex] = useState<number | undefined>(undefined);
  const { token } = useStore();

  const { status, setFailed } = useStatusPolling({
    id,
    onCompleted: (resultUrl) => {
      if (resultUrl) {
        loadResultData(resultUrl);
      }
    }
  });

  const createColumnDefs = (data: RecordData[]): ColumnDef<RecordData, any>[] => {
      if (!data || !Array.isArray(data) || data.length === 0) {
          setFailed('No valid data available for display');
          return [];
      }

      try {
          const sampleIndex = data.findIndex(item => item && typeof item === 'object' && Object.keys(item).length > 0);

          if (sampleIndex === -1) {
              setFailed('Unable to process data format for display');
              return [];
          }

          const sample = data[sampleIndex];

          return Object.keys(sample).map((key) => ({
              accessorKey: key,
              header: key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' '),
              enableHiding: true,
          })) as ColumnDef<Record<string, any>, any>[];
      } catch (error) {
          setFailed('Failed to process data for display');
          return [];
      }
  };

  const generateEarthMap = () => {
    if (tableData.length > 0) {
        const downloadUrl = `https://whisp.openforis.org/api/generate-geojson/${id}`;
        const url = `https://whisp.earthmap.org/?aoi=WHISP&fetchJson=${downloadUrl}`;
        window.open(url, '_blank');
    }
  }

  const loadResultData = async (resultUrl: string) => {
    try {
      const response = await fetch(resultUrl);
      if (!response.ok) {
        throw new Error(`Failed to load result data: ${response.statusText}`);
      }
      const result = await response.json();

      if (result.data) {
        setGeoJsonData(result.data);
        const { data: processedData, error } = validateAndProcessGeoJSON(result.data);

        if (error) {
          setFailed(error);
          return;
        }

        setTableData(processedData);
        const columnDefs = createColumnDefs(processedData);
        setColumns(columnDefs);
      }
    } catch (error) {
      setFailed('Failed to load analysis results');
    }
  };

  if (!status || status.status === 'processing') {
    return (
      <StatusCard
        title="Analysis in Progress"
        message="Processing your analysis..."
        showSpinner
      >
        <p className="text-gray-400 text-sm">This page will automatically update when the analysis is complete.</p>
      </StatusCard>
    )
  }

  if (status?.status === 'not_found') {
    return (
      <StatusCard
        title="404 - Not Found"
        message="The requested analysis could not be found."
      />
    )
  }

  if (status?.status === 'failed') {
    return (
      <StatusCard
        title="Analysis Failed"
        message={status?.error || 'An error occurred during analysis.'}
      >
        <Button
          variant="secondary"
          onClick={() => {
            window.history.back();
          }}
          className="bg-gray-600 hover:bg-gray-700 text-white"
        >
          Go Back
        </Button>
      </StatusCard>
    )
  }

  if (status?.status === 'completed') {
    return (
      <StatusCard
        title="Results"
      >
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
        
        <div className="flex flex-wrap justify-center my-4 gap-2">
            <div className="w-full sm:w-52">
                <button
                    onClick={() => generateEarthMap()}
                    className={`w-full text-white font-bold py-1 px-2 text-sm rounded bg-indigo-500 hover:bg-indigo-700`}
                    disabled={tableData.length === 0 ? true : false}
                >
                    View in Whisp Map
                </button>
            </div>
            <div className="w-full sm:w-52">
                <DownloadDropdown
                    token={token}
                    id={id}
                />
            </div>
        </div>
        <div className={`${showMap ? 'flex flex-col lg:flex-row gap-4' : ''}`}>
            <div className={`${showMap ? 'lg:w-1/2' : 'w-full'}`}>
                {tableData && columns && columns.length > 0 && (
                    <DataTable
                        columns={columns}
                        data={tableData}
                        onRowClick={(rowIndex) => setSelectedRowIndex(rowIndex)}
                        selectedRowIndex={selectedRowIndex}
                    />
                )}
            </div>

            {showMap && geoJsonData && (
                <div className="lg:w-1/2 h-96 lg:h-[600px]">
                    <MapView
                        geoJsonData={geoJsonData}
                        selectedFeatureIndex={selectedRowIndex}
                        onFeatureClick={(featureIndex) => setSelectedRowIndex(featureIndex)}
                    />
                </div>
            )}
        </div>
      </StatusCard>
    )
  }
}