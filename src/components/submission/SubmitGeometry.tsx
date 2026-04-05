'use client'
import React, { useEffect, useState } from 'react';
import { useStore } from '@/store';
import { FileInput } from '@/components/submission/FileInput';
import { Buttons } from '@/components/submission/Buttons';
import { parseWKTAndJSONFile } from "@/lib/utils/fileParser";
import { useSubmitAnalysis, setSubmissionError, clearSubmissionError, type SubmitPayload } from '@/lib/hooks/useSubmitAnalysis';
import AnalysisOptions, { AnalysisOptionsValue, DEFAULT_ANALYSIS_OPTIONS } from '@/components/submission/AnalysisOptions';
import SampleDownloadButton from '@/components/submission/SampleDownloadButton';

interface SubmitGeometryProps {
    asyncThreshold: number;
    maxGeometryLimit: number;
}

const SubmitGeometry: React.FC<SubmitGeometryProps> = ({ 
    asyncThreshold,
    maxGeometryLimit
}) => {
    const [payload, setPayload] = useState<SubmitPayload | null>(null);
    const [isDisabled, setIsDisabled] = useState<boolean>(true);
    const [analysisOptions, setAnalysisOptions] = useState<AnalysisOptionsValue>(DEFAULT_ANALYSIS_OPTIONS);
    const [featureCount, setFeatureCount] = useState<number>(0);
    const [fileName, setFileName] = useState('');

    const preloadedGeojson = useStore((state) => state.preloadedGeojson);
    const submit = useSubmitAnalysis({ asyncThreshold, analysisOptions, featureCount });

    useEffect(() => {
        if (!preloadedGeojson) return;
        const count = preloadedGeojson.features?.length ?? 0;
        setPayload({ type: 'json', geojson: preloadedGeojson });
        setFeatureCount(count);
        setIsDisabled(false);
        setFileName('Asset Registry');
        useStore.setState({ preloadedGeojson: null });
    }, [preloadedGeojson]);

    const handleFileChange = async (file: File) => {
        clearSubmissionError();
        if (!file) return;

        const result = await parseWKTAndJSONFile(file);

        if ('error' in result) {
            setSubmissionError(result.error);
            setFileName('');
            setIsDisabled(true);
            setFeatureCount(0);
            return;
        }

        if (result.featureCount > maxGeometryLimit) {
            setSubmissionError(`Too many geometries. Maximum allowed is ${maxGeometryLimit} features.`);
            setFileName('');
            setIsDisabled(true);
            setFeatureCount(0);
            return;
        }

        setFileName(file.name);
        setFeatureCount(result.featureCount);
        setIsDisabled(false);

        if ('wkt' in result) {
            setPayload({ type: 'wkt', wkt: result.wkt });
        } else if ('json' in result) {
            setPayload({ type: 'json', geojson: result.json });
        }
    };

    const clearInput = () => {
        setIsDisabled(true);
        setPayload(null);
        clearSubmissionError();
        setFileName('');
        setFeatureCount(0);
    };

    const analyze = () => {
        if (!payload) return;
        submit(payload);
    };

    const accept = {
        'text/plain': ['.txt'],
        'application/json': ['.json', '.geojson']
    };

    return (
        <div className="relative">
            <div className="p-2 rounded-b-lg">
                <FileInput
                    innerMessage="Accepted format: .txt, .json and .geojson files"
                    handleFileChange={handleFileChange}
                    accept={accept}
                    fileName={fileName}
                    onError={setSubmissionError}
                />
            </div>
            
            <div className="mx-2 mt-4">
                <AnalysisOptions value={analysisOptions} onChange={setAnalysisOptions} />
            </div>

            <div className="flex items-center mx-2 justify-between mt-4">
                <SampleDownloadButton href="/whisp_example_polys.geojson" filename="whisp_example_polys.geojson" />
            </div>
            
            <div className="flex items-center justify-between mt-4">
                <div></div>
                <Buttons clearInput={clearInput} analyze={analyze} isDisabled={isDisabled} />
            </div>
        </div>
    );
};

export default SubmitGeometry;

