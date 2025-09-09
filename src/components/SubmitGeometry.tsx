'use client'
import React, { useState } from 'react';
import Alert from '@/components/Alert';
import { useStore } from '@/store';
import { FileInput } from '@/components/FileInput';
import { Buttons } from '@/components/Buttons';
import Image from 'next/image';
import { useSafeRouterPush } from '@/lib/utils/safePush';
import { parseWKTAndJSONFile } from "@/lib/utils/fileParser";
import { fetchTempApiKey, fetchUserApiKey, createApiHeaders } from '@/lib/secureApiUtils';
import AnalysisOptions, { AnalysisOptionsValue, DEFAULT_ANALYSIS_OPTIONS } from '@/components/AnalysisOptions';
import { SystemCode } from '@/types/systemCodes';

interface SubmitGeometryProps {
    useTempKey?: boolean;
}

const SubmitGeometry: React.FC<SubmitGeometryProps> = ({ useTempKey = true }) => {
    const [wkt, setWkt] = useState<string>('');
    const [geojson, setGeojson] = useState<any>(undefined);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [isDisabled, setIsDisabled] = useState<boolean>(true);
    const { error } = useStore();
    const [type, setType] = useState<string>('');
    const [analysisOptions, setAnalysisOptions] = useState<AnalysisOptionsValue>(DEFAULT_ANALYSIS_OPTIONS);

    const safePush = useSafeRouterPush();
    const resetStore = useStore((state) => state.reset);

    const clearError = () => useStore.setState({ error: "" });

    const handleFileChange = async (file: File) => {
        clearError();
        if (file) {
            const result = await parseWKTAndJSONFile(file);

            if (result && 'error' in result) {
                useStore.setState({ error: result.error, selectedFile: "" });
                setIsDisabled(true);
            } else {
                setIsDisabled(false);
                useStore.setState({ selectedFile: file.name });
                if (result && 'wkt' in result) {
                    setType('wkt');
                    setWkt(result.wkt);
                }
                else if (result && 'json' in result) {
                    setType('json');
                    setGeojson(result.json);
                }
            }
        }
    };

    const clearInput = () => {
        setIsDisabled(true);
        clearError();
        useStore.setState({ selectedFile: "" });
    };

    const analyze = async () => {
        setIsLoading(true);

        try {
            // Get the appropriate API key based on useTempKey flag
            let apiKey = null;
            if (useTempKey) {
                try {
                    apiKey = await fetchTempApiKey('submit-geometry');
                } catch (err) {
                    console.error('Error fetching temp API key:', err);
                    throw new Error("Failed to get API key for authentication");
                }
            } else {
                // For authenticated users, fetch their own API key
                try {
                    apiKey = await fetchUserApiKey();
                } catch (err) {
                    console.error('Error fetching user API key:', err);
                    throw new Error("Failed to get API key for authenticated user");
                }
            }

            let fetchedData, response;
            // Use the utility function to create headers with the retrieved API key
            const headers = createApiHeaders(apiKey);
            
            // Always use the secure endpoints
            const apiBasePath = '/api/submit';

            let endpoint = '';
            let body: any = {};

            if (type === 'wkt') {
                endpoint = `${apiBasePath}/wkt`;
                body = { wkt, analysisOptions };
            } else if (type === 'json') {
                endpoint = `${apiBasePath}/geojson`;
                const geojsonWithOptions = {
                    ...geojson,
                    analysisOptions
                };
                body = geojsonWithOptions;
            }

            if (endpoint) {
                response = await fetch(endpoint, {
                    method: 'POST',
                    headers,
                    body: JSON.stringify(body),
                });
                fetchedData = await response.json();
            }

            if (!fetchedData || !response) {
                throw new Error(`No response from the server`);
            }

            if (!response.ok && fetchedData['error']) {
                throw new Error(`${fetchedData['error']}`);
            }

            if (!response.ok) {
                throw new Error(`Server error with status ${response.status}`);
            }

            if (fetchedData) {
                resetStore();

                // Always handle as async response - redirect to results page for polling
                if (fetchedData.code === SystemCode.ANALYSIS_PROCESSING) {
                    const { token } = fetchedData.data;
                    useStore.setState({ token });
                    safePush(`/results/${token}`);
                } else {
                    // Fallback for synchronous response (for backwards compatibility)
                    const { token, data } = fetchedData;
                    useStore.setState({ token, data });
                    safePush(`/results/${token}`);
                }
            }
        } catch (error: any) {
            useStore.setState({ error: error.message });
        } finally {
            setIsLoading(false);
        }
    };

    const downloadSampleDocument = () => {
        const element = document.createElement('a');
        element.setAttribute('href', '/whisp_example_polys.geojson');
        element.setAttribute('download', 'whisp_example_polys.geojson');
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
    };

    const renderExampleButton = () => (
        <button
            onClick={downloadSampleDocument}
            className="flex mt-2 items-center justify-center w-28 px-4 py-2 bg-blue-500 hover:bg-blue-700 text-white rounded focus:outline-none focus:shadow-outline"
            type="button"
        >
            <Image
                className='mr-2'
                onClick={clearError}
                src="/download-outline.svg"
                alt="download-outline"
                width={20}
                height={20}
            />
            Example
        </button>
    );

    const accept = {
        'text/plain': ['.txt'],
        'application/json': ['.json', '.geojson']
    };

    return (
        <div className="relative">
            {isLoading && (
                <div className="absolute top-0 left-0 right-0 bottom-0 bg-gray-200 bg-opacity-75 flex items-center justify-center z-10 rounded">
                    <div className="spinner border-4 border-blue-500 border-t-transparent rounded-full w-8 h-8 animate-spin"></div>
                </div>
            )}
            
            <div className="mx-2 mb-4">
                {error && <Alert type="error" message={error} onClose={clearError} />}
            </div>
            
            <div className="p-2 rounded-b-lg">
                <FileInput
                    innerMessage="Only .txt, .json and .geojson files are accepted."
                    handleFileChange={handleFileChange}
                    accept={accept}
                />
            </div>
            
            <div className="mx-2 mt-4">
                <AnalysisOptions value={analysisOptions} onChange={setAnalysisOptions} disabled={isLoading} />
            </div>

            <div className="flex items-center mx-2 justify-between mt-4">
                {renderExampleButton()}
            </div>
            
            <div className="flex items-center justify-between mt-4">
                <div></div>
                <Buttons clearInput={clearInput} analyze={analyze} isDisabled={isDisabled} />
            </div>
        </div>
    );
};

export default SubmitGeometry;

