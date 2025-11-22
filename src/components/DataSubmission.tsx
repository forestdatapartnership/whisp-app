'use client'
import React, { useState } from 'react';
import SubmitGeometry from '@/components/SubmitGeometry';
import SubmitGeoIds from '@/components/SubmitGeoIds';
import Link from 'next/link';
import { useStore } from '@/store';
import StatusCard from '@/components/StatusCard';

interface DataSubmissionProps {
    useTempKey?: boolean;
}

type SubmissionMode = 'geometry' | 'geoids';

const DataSubmission: React.FC<DataSubmissionProps> = ({ useTempKey = true }) => {
    const [activeMode, setActiveMode] = useState<SubmissionMode>('geometry');
    const resetStore = useStore((state) => state.reset);
    const isLoading = useStore((state) => state.isLoading);
    const featureCount = useStore((state) => state.featureCount);

    const handleModeChange = (mode: SubmissionMode) => {
        setActiveMode(mode);
        // Clear store when switching modes to avoid data conflicts
        resetStore();
    };

    const renderModeSelector = () => (
        <div className="flex justify-center space-x-1 p-2 mb-4">
            <button
                onClick={() => handleModeChange('geometry')}
                className={`py-2 px-6 rounded-l-lg transition-colors duration-200 ${
                    activeMode === 'geometry'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
            >
                Submit Geometry
            </button>
            <button
                onClick={() => handleModeChange('geoids')}
                className={`py-2 px-6 rounded-r-lg transition-colors duration-200 ${
                    activeMode === 'geoids'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
            >
                Submit Geo IDs
            </button>
        </div>
    );

    const renderContent = () => {
        if (activeMode === 'geometry') {
            return <SubmitGeometry useTempKey={useTempKey} />;
        } else {
            return <SubmitGeoIds useTempKey={useTempKey} />;
        }
    };

    return (
        <div className="p-5 border border-gray-300 bg-gray-800 rounded shadow-md my-4 relative">
            {isLoading && (
                <div className="absolute inset-0 z-10 rounded bg-gray-800 bg-opacity-75">
                    <StatusCard
                        title="Analysis in Progress"
                        message={featureCount > 0 ? `Processing ${featureCount} feature${featureCount !== 1 ? 's' : ''}...` : "Processing your analysis..."}
                        showSpinner
                        hideBorder
                    >
                    </StatusCard>
                </div>
            )}
            
            <div className={isLoading ? "opacity-50 pointer-events-none" : ""}>
                <h1 className="text-2xl font-semibold text-center mb-4">
                    {activeMode === 'geometry' ? 'Submit Geometry' : 'Submit Geo IDs'}
                </h1>
                
                {renderModeSelector()}
                
                {renderContent()}
                
                <div className="flex items-center justify-center mt-4">
                    <Link 
                        href="https://openforis.org/whisp-terms-of-service/" 
                        target="_blank" 
                        className="text-blue-500 hover:underline"
                    >
                        Terms of Service
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default DataSubmission; 