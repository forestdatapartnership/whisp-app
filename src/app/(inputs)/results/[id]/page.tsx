'use client'

import React, { useState, useEffect } from 'react';
import DataTable from '@/components/DataTable';
import ErrorAlert from '@/components/ErrorBar';
import SuccessAlert from '@/components/SuccessBar';
import { useParams, useRouter } from 'next/navigation';
import { useStore } from "@/store";

const Results: React.FC = () => {
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [isCeoDisabled, setIsCeoDisabled] = useState<boolean>(false);
    const [isCeDisabled, setIsCeDisabled] = useState<boolean>(false);
    const [isCsvDisabled, setIsCsvDisabled] = useState<boolean>(false);
    const [successMessage, setSuccessMessage] = useState<string>("");
    const [ceoLink, setCeoLink] = useState<string>("");

    const clearSuccessMessage = () => setSuccessMessage('');

    const { token, data, error } = useStore();

    const { id } = useParams<{ id: string }>();

    const csvUrl = `/api/download-csv/${token}`;
    const collectEarthUrl = `/api/generate-ce-project/${token}`;

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await fetch(`/api/report/${id}`);
                if (!response.ok) {
                    throw new Error('Failed to fetch report');
                }
                const fetchedData = await response.json();
                useStore.setState({ data: fetchedData.data }); // Update the store with the fetched data
            } catch (error: any) {
                console.error('Failed to fetch report:', error);
                useStore.setState({ error: error.message });
            } finally {
                setIsLoading(false); // Hide loading indicator after fetch completes or fails
            }
        };
    
        if (!data || data.length === 0) {
            fetchData();
        }
    }, [id, data]);


    const createCeoProject = async (token: string) => {
        try {
            setIsLoading(true); // Indicate loading
            const response = await fetch(`/api/generate-ceo-project/${token}`, {
                method: 'GET'
            });

            const data = await response.json();

            if (!data) {
                throw new Error(`No response from the server`);
            }

            if (!response.ok && data['error']) {
                throw new Error(`${data['error']}`);
            }

            if (!response.ok) {
                throw new Error(`Server error with status ${response.status}`);
            }

            if (data && data.ceoProjectLink) {
                setCeoLink(data.ceoProjectLink);
                // Update this line to include an anchor tag
                setSuccessMessage(`Please click <a href="${data.ceoProjectLink}" target="_blank"><strong>here</strong></a> to see the CEO Project`);
                setIsCeoDisabled(true); // Disable CEO button after success
            }
        } catch (error: any) {
            useStore.setState({ error: error.message });
        } finally {
            setIsLoading(false); // Reset loading state
        }
    }

    const generateEarthMap = () => {

        if (data.length > 0) {
            const geoids = data.map((item: any) => item.geoid).join(',');
            // Construct the URL with these IDs
            const url = `https://whisp.earthmap.org/?geoIds=${geoids}&embed`
            window.open(url, '_blank');
        }
    }

    return (
        <div className="p-4 border border-gray-300 bg-gray-800 rounded shadow-md my-4">
            {isLoading && (
                <div className="absolute top-0 left-0 right-0 bottom-0 bg-gray-200 bg-opacity-75 flex items-center justify-center z-10">
                    <div className="spinner border-4 border-blue-500 border-t-transparent rounded-full w-8 h-8 animate-spin"></div>
                </div>
            )}
            {!data || data.length === 0 ? (
                <div className="text-xl text-center text-white">Report not found.</div>
            ) : (
                <>
                    <h1 className="text-2xl font-semibold text-center mb-2">Results</h1>
                    <div className="flex flex-wrap justify-center my-4 gap-2">
                        <div className="w-full sm:w-52">
                            <button
                                onClick={() => createCeoProject(token)}
                                className={`w-full text-white font-bold py-1 px-2 text-sm rounded ${isCeoDisabled ? 'bg-blue-300' : 'bg-blue-500 hover:bg-blue-700'}`}
                                disabled={isCeoDisabled}>
                                Create CEO Project
                            </button>
                        </div>
                        <div className="w-full sm:w-52">
                            <button
                                onClick={() => generateEarthMap()}
                                className={`w-full text-white font-bold py-1 px-2 text-sm rounded bg-indigo-500 hover:bg-indigo-700`}
                                disabled={data.length === 0 ? true : false}
                            >
                                View in Whisp Map
                            </button>
                        </div>
                        <div className="w-full sm:w-52">
                            <a
                                href={isCeDisabled ? '#' : collectEarthUrl}
                                download={!isCsvDisabled}
                                className="w-full inline-flex justify-center items-center text-white font-bold py-1 px-2 text-sm rounded bg-green-500 hover:bg-green-700 disabled:bg-green-300"
                                style={{ textDecoration: 'none' }}
                                role="button">
                                Download Collect Earth File
                            </a>
                        </div>
                        <div className="w-full sm:w-52">
                            <a
                                href={isCsvDisabled ? '#' : csvUrl}
                                download={!isCsvDisabled}
                                className={`inline-block w-full text-white font-bold py-1 px-2 text-sm rounded text-center ${isCsvDisabled ? 'bg-yellow-300' : 'bg-yellow-500 hover:bg-yellow-700'}`}>
                                Download CSV
                            </a>
                        </div>
                    </div>
                    {error && <ErrorAlert />}
                    {successMessage && <SuccessAlert successMessage={successMessage} clearSuccessMessage={clearSuccessMessage} />}
                    <DataTable data={data} />
                </>
            )}
        </div>
    );


};
export default Results;
