'use client'
import React, { useState } from 'react';
import Alert from '@/components/Alert';
import { useStore } from '@/store';
import { FileInput } from '@/components/FileInput';
import { Buttons } from '@/components/Buttons';
import Image from 'next/image';
import { useSafeRouterPush } from '@/utils/safePush';
import { parseWKTAndJSONFile } from "@/utils/fileParser";
import Link from 'next/link';
import { fetchTempApiKey, createApiHeaders } from '@/utils/secureApiUtils';

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
            // Get the temp API key at the start of the analysis
            let apiKey = null;
            if (useTempKey) {
                try {
                    apiKey = await fetchTempApiKey('submit-geometry');
                } catch (err) {
                    console.error('Error fetching temp API key:', err);
                    throw new Error("Failed to get API key for authentication");
                }
            }

            let data, response;
            // Use the utility function to create headers with the freshly retrieved API key
            const headers = createApiHeaders(apiKey);
            
            // Always use the secure endpoints
            const apiBasePath = '/api/submit/';

            if (type === 'wkt') {
                response = await fetch(`${apiBasePath}wkt`, {
                    method: 'POST',
                    headers,
                    body: JSON.stringify({ wkt }),
                });

                data = await response.json();
            } else if (type === 'json') {
                response = await fetch(`${apiBasePath}geojson`, {
                    method: 'POST',
                    headers,
                    body: JSON.stringify({ ...geojson }),
                });

                data = await response.json();
            }

            if (!data || !response) {
                throw new Error(`No response from the server`);
            }

            if (!response.ok && data['error']) {
                throw new Error(`${data['error']}`);
            }

            if (!response.ok) {
                throw new Error(`Server error with status ${response.status}`);
            }

            if (data) {
                resetStore();
                useStore.setState({ token: data.token, data: data.data });
                safePush(`/results/${data.token}`);
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
        <div className="md:max-w-2xl p-5 border border-gray-300 bg-gray-800 rounded shadow-md mx-auto my-4 relative">
            {isLoading && (
                <div className="absolute top-0 left-0 right-0 bottom-0 bg-gray-200 bg-opacity-75 flex items-center justify-center z-10">
                    <div className="spinner border-4 border-blue-500 border-t-transparent rounded-full w-8 h-8 animate-spin"></div>
                </div>
            )}
            <h1 className="text-2xl font-semibold text-center mb-2">Submit Geometry</h1>
            <div className="mx-2">
                {error && <Alert type="error" message={error} onClose={clearError} />}
            </div>
            <div className="p-2 rounded-b-lg">
                <FileInput
                    innerMessage="Only .txt, .json and .geojson files are accepted."
                    handleFileChange={handleFileChange}
                    accept={accept}
                />
            </div>
            <div className="flex items-center mx-2 justify-between">
                {renderExampleButton()}
            </div>
            <div className="flex items-center justify-between">
                <Link href="https://openforis.org/whisp-terms-of-service/" target="_blank" className="text-blue-500 mx-1">
                    Terms of Service
                </Link>
                <Buttons clearInput={clearInput} analyze={analyze} isDisabled={isDisabled} />
            </div>
        </div>
    );
};

export default SubmitGeometry;

