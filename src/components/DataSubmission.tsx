'use client'
import React, { useState, useMemo } from 'react';
import SubmitGeometry from '@/components/SubmitGeometry';
import SubmitGeoIds from '@/components/SubmitGeoIds';
import Link from 'next/link';
import { useStore } from '@/store';
import StatusCard from '@/components/StatusCard';
import { useConfig } from '@/lib/contexts/ConfigContext';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useApiKey } from '@/lib/contexts/ApiKeyContext';
import { getAsyncThreshold, getMaxGeometryLimit } from '@/lib/utils/configUtils';

type SubmissionMode = 'geometry' | 'geoids';

const DataSubmission: React.FC = () => {
    const [activeMode, setActiveMode] = useState<SubmissionMode>('geometry');
    const resetStore = useStore((state) => state.reset);
    const isLoading = useStore((state) => state.isLoading);
    const featureCount = useStore((state) => state.featureCount);
    
    const { config } = useConfig();
    const { isAuthenticated } = useAuth();
    const { apiKey } = useApiKey();
    const asyncThreshold = useMemo(() => getAsyncThreshold(config), [config]);
    const maxGeometryLimit = useMemo(() => getMaxGeometryLimit(config), [config]);
    
    const requiresUserKey = isAuthenticated && !apiKey;

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
            return <SubmitGeometry 
                asyncThreshold={asyncThreshold}
                maxGeometryLimit={maxGeometryLimit}
            />;
        } else {
            return <SubmitGeoIds 
                asyncThreshold={asyncThreshold}
                maxGeometryLimit={maxGeometryLimit}
            />;
        }
    };

    if (requiresUserKey) {
        return (
            <div className="p-5 border border-gray-300 bg-gray-800 rounded shadow-md my-4">
                <div className="text-center py-8">
                    <div className="mb-4">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-4">API Key Required</h2>
                    <p className="text-gray-400 mb-6">
                        You need to create an API key to submit analysis requests. Click below to go to your dashboard and create one.
                    </p>
                    <Link href="/dashboard">
                        <button className="px-6 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
                            Go to Dashboard
                        </button>
                    </Link>
                </div>
            </div>
        );
    }

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