'use client'
import React, { useState } from 'react';
import ErrorAlert from '@/components/ErrorBar';
import { useStore } from '@/store';
import { useRouter } from 'next/navigation';
import { FileInput } from '@/components/FileInput';
import { Buttons } from '@/components/Buttons';
import { isValidWkt } from '@/utils/validateWkt';

const WktJsonInput: React.FC = () => {
    const [wkt, setWkt] = useState<string>('');
    const [geojson, setGeojson] = useState<any>(undefined);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [isDisabled, setIsDisabled] = useState<boolean>(true);
    const { error } = useStore();
    const [type, setType] = useState<string>('');

    const router = useRouter();

    const resetStore = useStore((state) => state.reset);

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        useStore.setState({ error: "" });
        const file = event.target.files ? event.target.files[0] : null;

        if (file) {
            const fileReader = new FileReader();

            fileReader.onload = async (event) => {
                const text = event.target?.result;
                if (typeof text === 'string') {
                    try {
                        if (file.name.endsWith('.txt')) {
                            setType('wkt');
                            const isValidWKT = isValidWkt(text);
                            if (!isValidWKT) {
                                useStore.setState({ error: "Invalid WKT format" });
                            } else {
                                setWkt(text);
                                useStore.setState({ selectedFile: file.name });
                            }

                        } else if (file.name.endsWith('.json') || file.name.endsWith('.geojson')) {
                            setType('json');
                            const jsonData = JSON.parse(text);
                            setGeojson({ ...jsonData });
                            useStore.setState({ selectedFile: file.name });
                        }
                    } catch (error) {
                        useStore.setState({ error: "Error parsing file. Please check the file format." });
                    }
                }
            };
            fileReader.readAsText(file); // Initiate the reading process
            setIsDisabled(false);
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
                    body: JSON.stringify({ wkt: wkt }),
                });

                data = await response.json();

            } else if (type === ('json')) {

                response = await fetch('/api/geojson', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ ...geojson }),
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
                router.push(`/results/${data.token}`);
            }

        } catch (error: any) {
            useStore.setState({ error: error.message });
            setIsLoading(false);
        }
    };

    return (
        <div className="p-5 border w-6/12 border-gray-300 bg-gray-800 rounded shadow-md mx-auto my-4 relative">
            <>
                {isLoading && (
                    <div className="absolute top-0 left-0 right-0 bottom-0 bg-gray-200 bg-opacity-75 flex items-center justify-center z-10">
                        <div className="spinner border-4 border-blue-500 border-t-transparent rounded-full w-8 h-8 animate-spin"></div>
                    </div>
                )}
                <h1 className="text-2xl font-semibold text-center mb-2">Submit Geometry</h1>
                {error && <ErrorAlert />}
                <div>
                    <div className="p-2 rounded-b-lg">
                        <FileInput alertMessage="Area must be smaller than 1,000 acres." innerMessage="Only .txt and .json files are accepted." handleFileChange={handleFileChange} input=".txt, .json" />
                    </div>
                </div>
                <Buttons clearInput={clearInput} analyze={analyze} isDisabled={isDisabled} />
            </>
        </div>
    );
};

export default WktJsonInput;
