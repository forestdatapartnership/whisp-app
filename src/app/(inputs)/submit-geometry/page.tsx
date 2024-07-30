'use client'
import React, { useState } from 'react';
import ErrorAlert from '@/components/ErrorBar';
import { useStore } from '@/store';
import { FileInput } from '@/components/FileInput';
import { Buttons } from '@/components/Buttons';
import Image from 'next/image';
import { useSafeRouterPush } from '@/utils/safePush';
import { parseWKTAndJSONFile } from "@/utils/fileParser";

const SubmitGeometry: React.FC = () => {
    const [wkt, setWkt] = useState<string>('');
    const [geojson, setGeojson] = useState<any>(undefined);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [isDisabled, setIsDisabled] = useState<boolean>(true);
    const { error } = useStore();
    const [type, setType] = useState<string>('');
    const [generateGeoids, setGenerateGeoids] = useState<boolean>(false);

    const safePush = useSafeRouterPush();

    const resetStore = useStore((state) => state.reset);

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        useStore.setState({ error: "" });
        const file = event.target.files ? event.target.files[0] : null;
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
        useStore.setState({ error: "", selectedFile: "" });
    }

    const analyze = async () => {

        setIsLoading(true)

        try {
            let data, response;
            if (type === 'wkt') {
                response = await fetch('/api/wkt', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ wkt: wkt, generateGeoids: generateGeoids }),
                });

                data = await response.json();

            } else if (type === ('json')) {

                response = await fetch('/api/geojson', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ ...geojson, generateGeoids: generateGeoids }),
                })

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
                useStore.setState({ token: data.token, data: data.data, error: "" });
                safePush(`/results/${data.token}`);
            }

        } catch (error: any) {
            useStore.setState({ error: error.message });
            setIsLoading(false);
        }
    };

    const downloadSampleDocument = () => {
        console.log('Downloading sample document...');

        const element = document.createElement('a');

        element.setAttribute('href', '/whisp_example_polys.geojson');

        element.setAttribute('download', 'whisp_example_polys.geojson');

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

    const renderGeoIdCheckbox = () => (
        <label className="flex items-center space-x-2">
            <input
                type="checkbox"
                checked={generateGeoids}
                onChange={() => setGenerateGeoids(!generateGeoids)}
                className="form-checkbox h-5 w-5"
            />
            <span className="text-white">Generate GeoIds</span>
        </label>
    )

    return (
        <div className="md:max-w-2xl p-5 border border-gray-300 bg-gray-800 rounded shadow-md mx-auto my-4 relative">
            {isLoading && (
                <div className="absolute top-0 left-0 right-0 bottom-0 bg-gray-200 bg-opacity-75 flex items-center justify-center z-10">
                    <div className="spinner border-4 border-blue-500 border-t-transparent rounded-full w-8 h-8 animate-spin"></div>
                </div>
            )}
            <h1 className="text-2xl font-semibold text-center mb-2">Submit Geometry</h1>
            {error && <ErrorAlert />}
            <div className="p-2 rounded-b-lg">
                <FileInput
                    innerMessage="Only .txt, .json and .geojson files are accepted."
                    handleFileChange={handleFileChange}
                    input=".txt, .json, .geojson"
                />
            </div>
            <div className="flex items-center mx-2 justify-between">
                {renderExampleButton()}
                {renderGeoIdCheckbox()}
            </div>
            <Buttons clearInput={clearInput} analyze={analyze} isDisabled={isDisabled} />
        </div>
    );
};

export default SubmitGeometry;
