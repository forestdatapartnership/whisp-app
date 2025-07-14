'use client'
import React, { useEffect, useState } from 'react';
import { useStore } from '@/store';
import Alert from '@/components/Alert';
import { Tabs } from '@/components/Tabs';
import { Buttons } from '@/components/Buttons';
import Image from 'next/image';
import { useSafeRouterPush } from '@/lib/utils/safePush';
import Link from 'next/link';
import { fetchTempApiKey, fetchUserApiKey, createApiHeaders } from '@/lib/secureApiUtils';


const GeoIdInput: React.FC = () => {
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [activeTab, setActiveTab] = useState<number>(0);

    const { error, geoIds } = useStore();
    const [isDisabled, setIsDisabled] = useState<boolean>(true);
    

    const setGeoIds = (newGeoIds: string[]) => {
        useStore.setState({ geoIds: newGeoIds });
    };

    const safePush = useSafeRouterPush();

    useEffect(() => {
        const hasGeoIds = geoIds?.some(geoId => geoId.trim() !== '');
        setIsDisabled(!hasGeoIds);
    }, [geoIds])

    const analyze = async () => {
        setIsLoading(true)
        useStore.setState({ error: '' });
        let apiKey = null;
        try {
            apiKey = await fetchTempApiKey('submit-geo-ids');
        } catch (err) {
            console.error('Error fetching temp API key:', err);
            throw new Error("Failed to get API key for authentication");
        }

        if (geoIds) {
            if (!geoIds.some(geoId => geoId.trim() !== '')) {
                useStore.setState({ error: 'Please enter at least one Geo ID or upload a file.' });
            } else {
                const cleanGeoIds = geoIds.filter(geoId => geoId.trim() !== '');
                try {
                    const headers = createApiHeaders(apiKey);
                    const response = await fetch('/api/geo-ids', {
                        method: 'POST',
                        headers,
                        body: JSON.stringify({ geoIds: cleanGeoIds }),
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

                    if (data) {
                        useStore.setState({ token: data.token, data: data.data, shpBase64: data.plotFileBase64, selectedFile: "" });
                        safePush(`/results/${data.token}`);
                    }
                } catch (error: any) {
                    useStore.setState({ error: error.message });
                    setIsLoading(false); // Stop loading on error
                }
            }
        }

    };

    const clearInput = () => {
        setGeoIds(['']);
        useStore.setState({ error: "", geoIds: [""], selectedFile: "" });
        setIsDisabled(true);
    };

    const downloadSampleDocument = () => {
        console.log('Downloading sample document...');

        const element = document.createElement('a');

        // Set the href to the path of the file you want to download
        element.setAttribute('href', '/geoids.txt');

        // Set the download attribute to a specific filename or leave it empty to use the original filename
        element.setAttribute('download', 'geoids.txt');

        // Append the anchor to the body
        document.body.appendChild(element);

        // Programmatically click the anchor to trigger the download
        element.click();

        // Remove the anchor from the body once the download is initiated
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
                onClick={() => useStore.setState({ error: '' })}
                src="/download-outline.svg"
                alt="download-outline"
                width={20}
                height={20}
            />
            Example
        </button>
    )

    return (
        <div className="md:max-w-2xl p-5 border border-gray-300 bg-gray-800 rounded shadow-md mx-auto my-4 relative">
            {isLoading && (
                <div className="absolute top-0 left-0 right-0 bottom-0 bg-gray-200 bg-opacity-75 flex items-center justify-center z-10">
                    <div className="spinner border-4 border-blue-500 border-t-transparent rounded-full w-8 h-8 animate-spin"></div>
                </div>
            )}
            <h1 className="text-2xl font-semibold text-center mb-4">Submit Geo IDs</h1>
            {error && <Alert type="error" message={error} />}
            <Tabs
                activeTab={activeTab}
                setActiveTab={setActiveTab}
            />
            <div className="flex items-center mx-2 justify-between">
                {renderExampleButton()}
                <Link
                    href="/"
                    className="text-blue-500 hover:underline"
                >
                    Submit Geometry
                </Link>
            </div>
            <div className="flex items-center justify-between">
                <Link href="https://openforis.org/whisp-terms-of-service/" target="_blank" className="text-blue-500 mx-1">Terms of Service</Link>
                <Buttons clearInput={clearInput} analyze={analyze} isDisabled={isDisabled} />
            </div>
        </div>
    );
};

export default GeoIdInput;