'use client'

import { useState, useCallback, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import StatusCard from '@/components/StatusCard'
import { useStatusSSE } from '@/lib/hooks/useStatusSSE'
import { useStatusPolling } from '@/lib/hooks/useStatusPolling'
import { DownloadDropdown } from "@/components/results/DownloadDropdown";
import { DataTable } from "@/components/results/DataTable"
import { useStore } from "@/store";
import { SystemCode } from '@/types/systemCodes'
import './styles.css'
import { ColumnDef } from '@tanstack/react-table'
import dynamic from 'next/dynamic';
import { FeatureCollection } from 'geojson';
import { validateAndProcessGeoJSON, RecordData } from '@/lib/utils/geojsonUtils';
import { fetchApiKey } from '@/lib/secureApiUtils';

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
  const [dataError, setDataError] = useState<string | null>(null);
  const [hasExternalIds, setHasExternalIds] = useState<boolean>(false);
  const [defaultSortColumnId, setDefaultSortColumnId] = useState<string | undefined>(undefined);
  const [syncResponse] = useState<any>(() => useStore.getState().response);
  const [apiKey, setApiKey] = useState<string | null>(null);

  const IGNORED_COLUMNS: string[] = ['whisp_processing_metadata', 'geometry', 'geojson'];

  const createColumnDefs = (data: RecordData[]): ColumnDef<RecordData, any>[] => {
      if (!data || !Array.isArray(data) || data.length === 0) {
          setDataError('No valid data available for display');
          return [];
      }

      try {
          const sampleIndex = data.findIndex(item => item && typeof item === 'object' && Object.keys(item).length > 0);

          if (sampleIndex === -1) {
              setDataError('Unable to process data format for display');
              return [];
          }

          const sample = data[sampleIndex];

          return Object.keys(sample)
              .filter(key => !IGNORED_COLUMNS.includes(key))
              .map((key) => {
                  const baseColumn = {
                      accessorKey: key,
                      header: key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' '),
                      enableHiding: true,
                  };

                  if (key.toLowerCase() === 'plotid') {
                      return {
                          ...baseColumn,
                          sortingFn: (rowA: any, rowB: any) => {
                              const a = parseInt(rowA.getValue(key), 10);
                              const b = parseInt(rowB.getValue(key), 10);
                              return a - b;
                          }
                      };
                  }

                  return baseColumn;
              }) as ColumnDef<Record<string, any>, any>[];
      } catch (error) {
          setDataError('Failed to process data for display');
          return [];
      }
  };

  const processResultData = useCallback((resultData: any) => {
    try {
      if (resultData) {
        setGeoJsonData(resultData);
        const { data: processedData, error } = validateAndProcessGeoJSON(resultData);

        if (error) {
          setDataError(error);
          return;
        }

        setTableData(processedData);
        const columnDefs = createColumnDefs(processedData);
        setColumns(columnDefs);
        
        const hasExternalIdData = processedData.some(row => 
          row.external_id && row.external_id !== 'na'
        );
        setHasExternalIds(hasExternalIdData);
        setDefaultSortColumnId(hasExternalIdData ? 'external_id' : 'plotId');
      }
    } catch (error) {
      setDataError('Failed to process analysis results');
    }
  }, []);

  const handleCompleted = useCallback((resultData: any) => {
    if (resultData) {
      processResultData(resultData);
    }
  }, [processResultData]);

  useEffect(() => {
    if (syncResponse?.data) {
      processResultData(syncResponse.data);
      useStore.setState({ response: null });
    }
  }, [syncResponse, processResultData]);

  useEffect(() => {
    const loadKey = async () => {
      try {
        const key = await fetchApiKey();
        setApiKey(key);
      } catch {
        setApiKey(null);
      }
    };
    loadKey();
  }, []);

  const { response: sseResponse, error: sseError, isLoading: isSSELoading } = useStatusSSE({
    id: syncResponse ? null : id,
    apiKey,
    onCompleted: handleCompleted
  });

  const shouldPoll = !!sseError && !syncResponse;

  const { response: polledResponse, error: pollingError, isLoading: isPollingLoading } = useStatusPolling({
    id: shouldPoll ? id : null,
    apiKey,
    onCompleted: handleCompleted
  });

  const response = syncResponse || (shouldPoll ? polledResponse || sseResponse : sseResponse || polledResponse);
  const generateEarthMap = () => {
    if (tableData.length > 0) {
        const downloadUrl = `https://whisp.openforis.org/api/generate-geojson/${id}`;
        const url = `https://whisp.earthmap.org/?aoi=WHISP&fetchJson=${downloadUrl}`;
        window.open(url, '_blank');
    }
  }

  const responseCode = response?.code;
  const isLoading = (syncResponse ? false : (shouldPoll ? isPollingLoading : isSSELoading)) || responseCode === SystemCode.ANALYSIS_PROCESSING;
  const hasTransportError = shouldPoll ? pollingError : sseError;
  const hasErrorCode = responseCode && responseCode !== SystemCode.ANALYSIS_PROCESSING && responseCode !== SystemCode.ANALYSIS_COMPLETED;
  const hasAnyError = !!(hasTransportError || hasErrorCode || dataError);

  // Show loading state while processing
  if (isLoading) {
    const featureCount = response?.data?.featureCount;
    const percent = response?.data?.percent;
    const processStatusMessages = response?.data?.processStatusMessages;
    const processingMessage = featureCount 
      ? `Processing ${featureCount} feature${featureCount !== 1 ? 's' : ''}...`
      : 'Processing your analysis...';
    
    return (
      <StatusCard
        title="Analysis in Progress"
        message={processingMessage}
        showSpinner
        progress={percent !== undefined || processStatusMessages !== undefined ? { percent, processStatusMessages } : null}
      >
        <p className="text-gray-400 text-sm">This page will automatically update when the analysis is complete.</p>
      </StatusCard>
    )
  }

  // Handle error states
  if (hasAnyError) {
    const getErrorTitle = () => {
      switch (responseCode) {
        case SystemCode.ANALYSIS_JOB_NOT_FOUND: return 'Analysis Not Found';
        case SystemCode.ANALYSIS_ERROR: return 'Analysis Failed';
        case SystemCode.ANALYSIS_TIMEOUT: return 'Analysis Timeout';
        case SystemCode.ANALYSIS_TOO_MANY_CONCURRENT: return 'Too Many Concurrent Analyses';
        case SystemCode.AUTH_RATE_LIMIT_EXCEEDED: return 'Rate Limit Exceeded';
        case SystemCode.VALIDATION_INVALID_EXTERNAL_ID_COLUMN: return 'Invalid Input';
        default: return 'Error';
      }
    };

    const getErrorMessage = () => {
      if (dataError) return dataError;
      if (hasTransportError) return `Network error: ${hasTransportError.message}`;
      if (response?.message) return response.message;
      return 'An unexpected error occurred.';
    };

    return (
      <StatusCard
        title={getErrorTitle()}
        message={getErrorMessage()}
      >
        <Button
          variant="secondary"
          onClick={() => window.history.back()}
          className="bg-gray-600 hover:bg-gray-700 text-white"
        >
          Go Back
        </Button>
      </StatusCard>
    )
  }

  // Handle successful completion
  if (responseCode === SystemCode.ANALYSIS_COMPLETED) {
    // Check if we have data to display
    if (!tableData || tableData.length === 0 || !columns || columns.length === 0) {
      return (
        <StatusCard
          title="Analysis Complete"
          message="The analysis completed successfully, but no data is available to display."
        >
          <Button
            variant="secondary"
            onClick={() => window.history.back()}
            className="bg-gray-600 hover:bg-gray-700 text-white"
          >
            Go Back
          </Button>
        </StatusCard>
      )
    }

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
              className="w-full text-white font-bold py-1 px-2 text-sm rounded bg-indigo-500 hover:bg-indigo-700 disabled:bg-gray-500"
              disabled={tableData.length === 0}
            >
              View in Whisp Map
            </button>
          </div>
          <div className="w-full sm:w-52">
            <DownloadDropdown
              id={id}
            />
          </div>
        </div>
        
        <div className={`${showMap ? 'flex flex-col lg:flex-row gap-4' : ''}`}>
          <div className={`${showMap ? 'lg:w-1/2' : 'w-full'}`}>
            <DataTable
              columns={columns}
              data={tableData}
              onRowClick={(rowIndex) => setSelectedRowIndex(rowIndex)}
              selectedRowIndex={selectedRowIndex}
              showExternalIdByDefault={hasExternalIds}
              defaultSortColumnId={defaultSortColumnId}
            />
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