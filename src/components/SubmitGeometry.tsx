'use client'
import React, { useState } from 'react';
import Alert from '@/components/Alert';
import { useStore } from '@/store';
import { FileInput } from '@/components/FileInput';
import { Buttons } from '@/components/Buttons';
import Image from 'next/image';
import { useSafeRouterPush } from '@/lib/utils/safePush';
import { parseWKTAndJSONFile } from "@/lib/utils/fileParser";
import { fetchApiKey, createApiHeaders } from '@/lib/secureApiUtils';
import AnalysisOptions, { AnalysisOptionsValue, DEFAULT_ANALYSIS_OPTIONS } from '@/components/AnalysisOptions';
import { SystemCode } from '@/types/systemCodes';

interface SubmitGeometryProps {
    asyncThreshold: number;
    maxGeometryLimit: number;
}

const SubmitGeometry: React.FC<SubmitGeometryProps> = ({ 
    asyncThreshold,
    maxGeometryLimit
}) => {
    const [wkt, setWkt] = useState<string>('');
    const [geojson, setGeojson] = useState<any>(undefined);
    const [isDisabled, setIsDisabled] = useState<boolean>(true);
    const { error } = useStore();
    const [type, setType] = useState<string>('');
    const [analysisOptions, setAnalysisOptions] = useState<AnalysisOptionsValue>(DEFAULT_ANALYSIS_OPTIONS);
    const [featureCount, setFeatureCount] = useState<number>(0);

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
                setFeatureCount(0);
            } else {
                const count = result.featureCount;
                
                if (count > maxGeometryLimit) {
                    useStore.setState({ 
                        error: `Too many geometries. Maximum allowed is ${maxGeometryLimit} features.`, 
                        selectedFile: "" 
                    });
                    setIsDisabled(true);
                    setFeatureCount(0);
                } else {
                    setIsDisabled(false);
                    useStore.setState({ selectedFile: file.name });
                    if (result && 'wkt' in result) {
                        setType('wkt');
                        setWkt(result.wkt);
                        setFeatureCount(result.featureCount);
                    }
                    else if (result && 'json' in result) {
                        setType('json');
                        setGeojson(result.json);
                        setFeatureCount(result.featureCount);
                    }
                }
            }
        }
    };

    const clearInput = () => {
        setIsDisabled(true);
        clearError();
        useStore.setState({ selectedFile: "" });
        setFeatureCount(0);
    };

    const analyze = async () => {
        useStore.setState({ isLoading: true, featureCount });

        try {
            const shouldUseAsync = featureCount > asyncThreshold;
            const updatedAnalysisOptions = {
                ...analysisOptions,
                async: shouldUseAsync
            };

            const apiKey = await fetchApiKey();
            if (!apiKey) {
                throw new Error("Failed to get API key for authentication");
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
                body = { wkt, analysisOptions: updatedAnalysisOptions };
            } else if (type === 'json') {
                endpoint = `${apiBasePath}/geojson`;
                const geojsonWithOptions = {
                    ...geojson,
                    analysisOptions: updatedAnalysisOptions
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

            if (!response.ok && fetchedData['message']) {
                throw new Error(`${fetchedData['message']}`);
            }

            if (!response.ok) {
                throw new Error(`Server error with status ${response.status}`);
            }

            if (fetchedData) {
                resetStore();

                if (fetchedData.code === SystemCode.ANALYSIS_PROCESSING) {
                    const { token } = fetchedData.data;
                    useStore.setState({ token });
                    safePush(`/results/${token}`);
                } else if (fetchedData.code === SystemCode.ANALYSIS_COMPLETED) {
                    const token = fetchedData.context?.token;
                    if (token) {
                        useStore.setState({ token, response: fetchedData });
                        safePush(`/results/${token}`);
                    }
                }
            }
        } catch (error: any) {
            useStore.setState({ error: error.message });
        } finally {
            useStore.setState({ isLoading: false });
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
                <AnalysisOptions value={analysisOptions} onChange={setAnalysisOptions} />
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

