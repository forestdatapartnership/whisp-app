'use client'

import React, { useState, useEffect } from 'react';
import { DataTable } from "@/components/results/DataTable"
import Alert from '@/components/Alert';
import { useParams } from 'next/navigation';
import { useStore } from "@/store";
import './styles.css';
import { ColumnDef } from '@tanstack/react-table';
import { FeatureCollection, Feature, Geometry, GeoJsonProperties } from 'geojson';
import dynamic from 'next/dynamic';

// Dynamically import MapView with no SSR to avoid window undefined error
const MapView = dynamic(() => import("@/components/results/MapView"), {
    ssr: false,
    loading: () => <div className="h-full w-full bg-gray-700 rounded-lg flex items-center justify-center">
        <div className="text-white">Loading map...</div>
    </div>
});

// Define types for data
type RecordData = Record<string, any>;

// Define a type for alerts to keep track of type and message
type AlertData = {
    type: 'error' | 'success' | 'warning';
    message: string;
} | null;

const Results: React.FC = () => {
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [isCsvDisabled, setIsCsvDisabled] = useState<boolean>(false);
    const [alert, setAlert] = useState<AlertData>(null);
    const [notFound, setNotFound] = useState<boolean>(false);
    const [geoIds, setGeoIds] = useState<string[]>([]);
    const [tableData, setTableData] = useState<Record<string, any>[]>([]);
    const [columns, setColumns] = useState<ColumnDef<Record<string, any>, any>[]>([]);
    const [isDownloading, setIsDownloading] = useState<boolean>(false);
    const [showMap, setShowMap] = useState<boolean>(false);
    const [geoJsonData, setGeoJsonData] = useState<FeatureCollection | null>(null);
    const [selectedRowIndex, setSelectedRowIndex] = useState<number | undefined>(undefined);

    const clearAlert = () => setAlert(null);

    const { token, data, error } = useStore();

    // Effect to sync store error with local alert state
    useEffect(() => {
        if (error) {
            setAlert({ type: 'error', message: error });
        }
    }, [error]);

    // Clear error from the store when alert is dismissed
    const clearStoreError = () => {
        useStore.setState({ error: "" });
        clearAlert();
    };

    const { id } = useParams<{ id: string }>();

    const csvUrl = `/api/download-csv/${token || id}`;

    // Process GeoJSON data into a format suitable for the DataTable
    const processGeoJSONData = (geoJSON: any): RecordData[] => {
        // Check if it's a valid GeoJSON FeatureCollection
        if (!geoJSON || !geoJSON.features || !Array.isArray(geoJSON.features)) {
            return [];
        }

        // Transform features into rows for the table
        return geoJSON.features.map((feature: Feature<Geometry, GeoJsonProperties>) => {
            // Combine properties with geometry
            return {
                ...feature.properties,
                geometry: feature.geometry
            };
        });
    };

    const createColumnDefs = (data: any): ColumnDef<Record<string, any>, any>[] => {

        if (!data || !Array.isArray(data) || data.length === 0) {
            console.log('No valid array data available for column creation');
            return [];
        }

        try {
            // Find the first non-null object in the data array
            const sampleIndex = data.findIndex(item => item && typeof item === 'object' && Object.keys(item).length > 0);

            if (sampleIndex === -1) {
                console.log('No valid sample found for column creation');
                return [];
            }

            const sample = data[sampleIndex];
            console.log("Creating columns from sample with keys:", Object.keys(sample));

            // Create column definitions from properties, properly formatted for the DataTable component
            return Object.keys(sample).map((key) => ({
                accessorKey: key,
                header: key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' '), // Format header for display
                enableHiding: true,
            })) as ColumnDef<Record<string, any>, any>[];
        } catch (error) {
            console.error('Error creating column definitions:', error);
            return [];
        }
    };

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            setNotFound(false);
            try {
                const response = await fetch(`/api/report/${id}`);
                if (!response.ok) {
                    setNotFound(true);
                    throw new Error('Failed to fetch report');
                }

                const fetchedData = await response.json();

                // Store the original GeoJSON data for the map
                setGeoJsonData(fetchedData.data);

                const processedData = processGeoJSONData(fetchedData.data);

                setTableData(processedData);
                const columnDefs = createColumnDefs(processedData);
                setColumns(columnDefs);
            } catch (error: any) {
                console.error(error);
                setAlert({ type: 'error', message: error.message });
                useStore.setState({ error: error.message });
            } finally {
                setIsLoading(false);
            }
        };

        // Check if we have data from the store
        if (!data) {
            fetchData();
        } else {
            // Store the original GeoJSON data for the map
            // Type check to ensure data is a valid FeatureCollection
            if (data && typeof data === 'object' && 'type' in data && data.type === 'FeatureCollection') {
                setGeoJsonData(data as FeatureCollection);
            } else {
                setGeoJsonData(null);
            }
            
            const processedData = processGeoJSONData(data);
            setTableData(processedData);
            const columnDefs = createColumnDefs(processedData);
            setColumns(columnDefs);
            setGeoIds(processedData.map((item: any) => item.geoid).filter(Boolean));
        }
    }, [id, data]);

    const generateEarthMap = () => {
        if (tableData.length > 0) {
            const downloadUrl = `https://whisp.openforis.org/api/generate-geojson/${id}`;
            const url = `https://whisp.earthmap.org/?aoi=WHISP&fetchJson=${downloadUrl}`;
            window.open(url, '_blank');
        }
    }

    const handleDownloadCsv = async () => {
        if (isCsvDisabled) return;

        setIsDownloading(true);
        try {
            const response = await fetch(csvUrl);

            if (!response.ok) {
                throw new Error(`Failed to download CSV: ${response.statusText}`);
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${token || id}.csv`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);

            setAlert({ type: 'success', message: "CSV downloaded successfully" });
        } catch (error: any) {
            console.error('Download failed:', error);
            setAlert({ type: 'error', message: error.message });
            useStore.setState({ error: error.message });
        } finally {
            setIsDownloading(false);
        }
    };

    return (
        <div className="p-4 border border-gray-300 bg-gray-800 rounded shadow-md my-4 relative">
            {isLoading && (
                <div className="absolute inset-0 bg-gray-800 bg-opacity-90 flex items-center justify-center z-10 rounded">
                    <div className="spinner border-4 border-blue-500 border-t-transparent rounded-full w-8 h-8 animate-spin"></div>
                </div>
            )}
            {!tableData || tableData.length === 0 ? (
                notFound ?
                    <div className="text-xl text-center text-white">Report not found.</div> : null
            ) : (
                <>
                    <h1 className="text-2xl font-semibold text-center mb-2 text-white">Results
                    </h1>
                    
                    {/* Map View checkbox - moved here */}
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
                            <button
                                onClick={handleDownloadCsv}
                                disabled={isCsvDisabled || isDownloading}
                                className={`w-full text-white font-bold py-1 px-2 text-sm rounded text-center ${isCsvDisabled ? 'bg-yellow-300' : isDownloading ? 'bg-yellow-400' : 'bg-yellow-500 hover:bg-yellow-700'}`}>
                                {isDownloading ? 'Downloading...' : 'Download CSV'}
                            </button>
                        </div>
                    </div>
                    {alert && <Alert type={alert.type} message={alert.message} onClose={alert.type === 'error' ? clearStoreError : clearAlert} />}

                    {/* Content area with map and table side by side when map is shown */}
                    <div className={`${showMap ? 'flex flex-col lg:flex-row gap-4' : ''}`}>
                        {/* Data Table - now on the left */}
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
                        
                        {/* Map View - now on the right */}
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
                </>
            )}
        </div>
    );
};
export default Results;
