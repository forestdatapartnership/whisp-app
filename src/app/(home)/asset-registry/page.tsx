'use client';

import { useState, useCallback } from 'react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import RegisterFeatures from '@/components/asset-registry/RegisterFeatures';
import RetrieveFeatures from '@/components/asset-registry/RetrieveFeatures';
import CollectionPicker from '@/components/shared/CollectionPicker';
import StatusCard from '@/components/shared/StatusCard';

type Tab = 'register' | 'retrieve';

function AssetRegistryContent() {
  const [selectedCollection, setSelectedCollection] = useState('');
  const [activeTab, setActiveTab] = useState<Tab>('register');
  const [isLoading, setIsLoading] = useState(false);

  const handleLoadingChange = useCallback((loading: boolean) => {
    setIsLoading(loading);
  }, []);

  return (
    <div className="p-5 border border-gray-300 bg-gray-800 rounded shadow-md my-4 relative">
      {isLoading && (
        <div className="absolute inset-0 z-10 rounded bg-gray-800 bg-opacity-75">
          <StatusCard
            title={activeTab === 'register' ? 'Registering Features' : 'Retrieving Features'}
            message={activeTab === 'register' ? 'Processing features...' : 'Fetching features from the registry...'}
            showSpinner
            hideBorder
          />
        </div>
      )}

      <div className={isLoading ? 'opacity-50 pointer-events-none' : ''}>
        <h1 className="text-2xl font-semibold text-center mb-4">
          Asset Registry
        </h1>

        <div className="flex justify-center space-x-1 p-2 mb-4">
          <button
            onClick={() => setActiveTab('register')}
            className={`py-2 px-6 rounded-l-lg transition-colors duration-200 ${
              activeTab === 'register' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            GeoJSON → GeoID
          </button>
          <button
            onClick={() => setActiveTab('retrieve')}
            className={`py-2 px-6 rounded-r-lg transition-colors duration-200 ${
              activeTab === 'retrieve' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            GeoID → GeoJSON
          </button>
        </div>

        <div className="mx-2 mb-4">
          <CollectionPicker
            value={selectedCollection}
            onChange={setSelectedCollection}
          />
        </div>

        {activeTab === 'register' && (
          <RegisterFeatures collection={selectedCollection} onLoadingChange={handleLoadingChange} />
        )}

        {activeTab === 'retrieve' && (
          <RetrieveFeatures collection={selectedCollection} onLoadingChange={handleLoadingChange} />
        )}
      </div>
    </div>
  );
}

export default function AssetRegistryPage() {
  return (
    <ProtectedRoute>
      <main className="mx-auto px-2 max-w-5xl">
        <AssetRegistryContent />
      </main>
    </ProtectedRoute>
  );
}
