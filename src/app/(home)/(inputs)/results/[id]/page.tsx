'use client'

import React, { useState, useEffect } from 'react';
import { DataTable } from "@/components/results/DataTable"
import Alert from '@/components/Alert';
import { useParams } from 'next/navigation';
import { useStore } from "@/store";
import './styles.css';
import { ColumnDef } from '@tanstack/react-table';

const Results: React.FC = () => {
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [isCsvDisabled, setIsCsvDisabled] = useState<boolean>(false);
    const [successMessage, setSuccessMessage] = useState<string>("");
    const [notFound, setNotFound] = useState<boolean>(false);
    const [geoIds, setGeoIds] = useState<string[]>([]);
    const [tableData, setTableData] = useState<any[]>([]);
    const [columns, setColumns] = useState<any[]>([]);
    const [isDownloading, setIsDownloading] = useState<boolean>(false);

    const clearSuccessMessage = () => setSuccessMessage("");

    const { token, data, error } = useStore();

    const clearError = () => useStore.setState({ error: "" });

    const { id } = useParams<{ id: string }>();

    const csvUrl = `/api/download-csv/${token || id}`;

    const createColumnDefs = (data: Record<string, any>[]): ColumnDef<Record<string, any>>[] => {
        if (data.length === 0) return [];
        const sample = data[0];
        return Object.keys(sample).map((key) => ({
            accessorKey: key,
            header: key,
        }));
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
                setTableData(fetchedData.data);
                const columnDefs = createColumnDefs(fetchedData.data);
                setColumns(columnDefs);
            } catch (error: any) {
                console.error(error);
                useStore.setState({ error: error.message });
            } finally {
                setIsLoading(false);
            }
        };

        if (!data || data.length === 0) {
            fetchData();
            setIsLoading(false);
        } else {
            setTableData(data);
            const columnDefs = createColumnDefs(data);
            setColumns(columnDefs);
            setGeoIds(data.map((item: any) => item.geoid));
        }
    }, [id, data]);

    const generateEarthMap = () => {
        if (tableData.length > 0) {
            const downloadUrl = `https://whisp.openforis.org/api/generate-geojson/${id}`
            const url = `https://whisp.earthmap.org/?fetchJson=${downloadUrl}`
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
            
            setSuccessMessage("CSV downloaded successfully");
        } catch (error: any) {
            console.error('Download failed:', error);
            useStore.setState({ error: error.message });
        } finally {
            setIsDownloading(false);
        }
    };

    return (
        <div className="p-4 border border-gray-300 bg-gray-800 rounded shadow-md my-4">
            {isLoading && (
                <div className="absolute top-0 left-0 right-0 bottom-0 bg-gray-200 bg-opacity-75 flex items-center justify-center z-10">
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
                    {error && <Alert type="error" message={error} onClose={clearError} />}
                    {successMessage && <Alert type="success" message={successMessage} onClose={clearSuccessMessage} />}
                    <DataTable columns={columns} data={tableData} />
                </>
            )}
        </div>
    );
};
export default Results;
