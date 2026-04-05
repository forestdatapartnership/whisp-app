'use client'
import React, { useState } from 'react';
import { GeoIdInput } from '@/components/submission/GeoIdInput';
import { Buttons } from '@/components/submission/Buttons';
import { useSubmitAnalysis, setSubmissionError, clearSubmissionError } from '@/lib/hooks/useSubmitAnalysis';
import { parseGeoIdText } from '@/lib/utils/fileParser';
import { useCollections } from '@/lib/hooks/useCollections';
import AnalysisOptions, { AnalysisOptionsValue, DEFAULT_ANALYSIS_OPTIONS } from '@/components/submission/AnalysisOptions';
import SampleDownloadButton from '@/components/submission/SampleDownloadButton';
import CollectionPicker from '@/components/shared/CollectionPicker';

interface SubmitGeoIdsProps {
    asyncThreshold: number;
    maxGeometryLimit: number;
}

const SubmitGeoIds: React.FC<SubmitGeoIdsProps> = ({ 
    asyncThreshold,
    maxGeometryLimit
}) => {
    const [geoIdText, setGeoIdText] = useState('');
    const [geoIdFile, setGeoIdFile] = useState('');
    const [analysisOptions, setAnalysisOptions] = useState<AnalysisOptionsValue>(DEFAULT_ANALYSIS_OPTIONS);

    const { collections, collection, setCollection, loading: registryLoading } = useCollections();

    const cleanIds = parseGeoIdText(geoIdText);
    const featureCount = cleanIds.length;
    const limitExceeded = featureCount > maxGeometryLimit;
    const isDisabled = featureCount === 0 || limitExceeded;
    const submit = useSubmitAnalysis({ asyncThreshold, analysisOptions, featureCount });

    const handleGeoIdChange = (value: string) => {
        setGeoIdText(value);
        const count = parseGeoIdText(value).length;
        if (count > maxGeometryLimit) {
            setSubmissionError(`Too many Geo IDs. Maximum allowed is ${maxGeometryLimit} features.`);
        } else {
            clearSubmissionError();
        }
    };

    const analyze = () => {
        clearSubmissionError();

        if (featureCount === 0) {
            setSubmissionError('Please enter at least one Geo ID or upload a file.');
            return;
        }

        submit({
            type: 'geo-ids',
            geoIds: cleanIds,
            ...(collection && { assetRegistryOptions: { collection } }),
        });
    };

    const clearInput = () => {
        setGeoIdText('');
        setGeoIdFile('');
        clearSubmissionError();
    };

    return (
        <div className="relative">
            <div className="mx-2 mb-4">
                <CollectionPicker
                    collections={collections}
                    value={collection}
                    onChange={setCollection}
                    loading={registryLoading}
                />
            </div>

            <div className="mx-2 mt-4">
                <GeoIdInput
                    value={geoIdText}
                    onChange={handleGeoIdChange}
                    fileName={geoIdFile}
                    onFileNameChange={setGeoIdFile}
                    onError={setSubmissionError}
                />
            </div>

            <div className="mx-2 mt-4">
                <AnalysisOptions value={analysisOptions} onChange={setAnalysisOptions} />
            </div>
            
            <div className="flex items-center mx-2 justify-between mt-4">
                <SampleDownloadButton href="/geoids.txt" filename="geoids.txt" />
            </div>
            

            <div className="flex items-center justify-between mt-4">
                <div></div>
                <Buttons clearInput={clearInput} analyze={analyze} isDisabled={isDisabled} />
            </div>
        </div>
    );
};

export default SubmitGeoIds;
