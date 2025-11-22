'use client'
import React, { useEffect, useState, useMemo } from 'react';
import { useStore } from '@/store';
import Alert from '@/components/Alert';
import { Tabs } from '@/components/Tabs';
import { Buttons } from '@/components/Buttons';
import Image from 'next/image';
import { useSafeRouterPush } from '@/lib/utils/safePush';
import { fetchTempApiKey, fetchUserApiKey, createApiHeaders } from '@/lib/secureApiUtils';
import AnalysisOptions, { AnalysisOptionsValue, DEFAULT_ANALYSIS_OPTIONS } from '@/components/AnalysisOptions';
import { SystemCode } from '@/types/systemCodes';
import { getAsyncThreshold } from '@/lib/utils/configUtils';
import { useConfig } from '@/lib/contexts/ConfigContext';

interface SubmitGeoIdsProps {
    useTempKey?: boolean;
}

const SubmitGeoIds: React.FC<SubmitGeoIdsProps> = ({ useTempKey = true }) => {
    const [activeTab, setActiveTab] = useState<number>(0);
    const [isDisabled, setIsDisabled] = useState<boolean>(true);
    const [analysisOptions, setAnalysisOptions] = useState<AnalysisOptionsValue>(DEFAULT_ANALYSIS_OPTIONS);

    const { error, geoIds } = useStore();
    const safePush = useSafeRouterPush();
    const { config } = useConfig();
    const asyncThreshold = useMemo(() => getAsyncThreshold(config), [config]);
    const clearError = () => useStore.setState({ error: "" });

    useEffect(() => {
        const hasGeoIds = geoIds?.some(geoId => geoId.trim() !== '');
        setIsDisabled(!hasGeoIds);
    }, [geoIds]);

    const analyze = async () => {
        useStore.setState({ isLoading: true, error: '' });
        
        let apiKey = null;
        try {
            // Get the appropriate API key based on useTempKey flag
            if (useTempKey) {
                apiKey = await fetchTempApiKey('submit-geo-ids');
            } else {
                // For authenticated users, fetch their own API key
                apiKey = await fetchUserApiKey();
            }
        } catch (err) {
            console.error('Error fetching API key:', err);
            useStore.setState({ error: "Failed to get API key for authentication", isLoading: false });
            return;
        }

        if (geoIds) {
            if (!geoIds.some(geoId => geoId.trim() !== '')) {
                useStore.setState({ error: 'Please enter at least one Geo ID or upload a file.', isLoading: false });
            } else {
                const cleanGeoIds = geoIds.filter(geoId => geoId.trim() !== '');
                
                useStore.setState({ featureCount: cleanGeoIds.length });
                
                const shouldUseAsync = cleanGeoIds.length > asyncThreshold;

                const updatedAnalysisOptions = {
                    ...analysisOptions,
                    async: shouldUseAsync
                };

                try {
                    const headers = createApiHeaders(apiKey);
                    const response = await fetch('/api/submit/geo-ids', {
                        method: 'POST',
                        headers,
                        body: JSON.stringify({ geoIds: cleanGeoIds, analysisOptions: updatedAnalysisOptions }),
                    });

                    const fetchedData = await response.json();

                    if (!fetchedData) {
                        throw new Error(`No response from the server`);
                    }

                    if (!response.ok && fetchedData['message']) {
                        throw new Error(`${fetchedData['message']}`);
                    }

                    if (!response.ok) {
                        throw new Error(`Server error with status ${response.status}`);
                    }

                    if (fetchedData) {
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
                    useStore.setState({ error: error.message, isLoading: false });
                }
            }
        }
    };

    const clearInput = () => {
        useStore.setState({ geoIds: [''], error: "", selectedFile: "" });
        setIsDisabled(true);
    };

    const downloadSampleDocument = () => {
        const element = document.createElement('a');
        element.setAttribute('href', '/geoids.txt');
        element.setAttribute('download', 'geoids.txt');
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
                src="/download-outline.svg"
                alt="download-outline"
                width={20}
                height={20}
            />
            Example
        </button>
    );

    return (
        <div className="relative">
            <div className="mx-2 mb-4">
                {error && <Alert type="error" message={error} onClose={clearError} />}
            </div>
            
            <Tabs
                activeTab={activeTab}
                setActiveTab={setActiveTab}
            />

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

export default SubmitGeoIds; 