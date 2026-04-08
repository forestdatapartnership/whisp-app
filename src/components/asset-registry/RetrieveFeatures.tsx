'use client';

import { useState, useCallback, useMemo } from 'react';
import type { FeatureCollection } from 'geojson';
import { useStore } from '@/store';
import { useSafeRouterPush } from '@/lib/hooks/useSafeRouterPush';
import { GeoIdInput } from '@/components/submission/GeoIdInput';
import Alert from '@/components/shared/Alert';
import { retrieveFeaturesByGeoIds } from '@/lib/assetRegistry/actions';
import { parseGeoIdText } from '@/lib/utils/fileParser';
import { downloadBlob } from '@/lib/utils/downloadFile';
import FeatureTable, { summarizeProperties } from '@/components/asset-registry/FeatureTable';
import type { FeatureRow } from '@/components/asset-registry/FeatureTable';

interface RetrieveFeaturesProps {
  collection: string;
  onLoadingChange?: (loading: boolean) => void;
}

export default function RetrieveFeatures({ collection, onLoadingChange }: RetrieveFeaturesProps) {
  const safePush = useSafeRouterPush();

  const [geoIdText, setGeoIdText] = useState('');
  const [geoIdFile, setGeoIdFile] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [retrievedData, setRetrievedData] = useState<FeatureCollection | null>(null);

  const hasGeoIds = parseGeoIdText(geoIdText).length > 0;

  const handleRetrieve = useCallback(async () => {
    const ids = parseGeoIdText(geoIdText);
    if (ids.length === 0) {
      setMessage({ type: 'error', text: 'Enter at least one GeoID' });
      return;
    }
    setLoading(true);
    onLoadingChange?.(true);
    setMessage(null);
    setRetrievedData(null);
    try {
      const result = await retrieveFeaturesByGeoIds(collection, ids);
      if (!result.ok || !result.featureCollection) {
        setMessage({ type: 'error', text: result.error ?? 'Retrieval failed' });
      } else {
        setRetrievedData(result.featureCollection);
        const count = result.featureCollection.features.length;
        setMessage({ type: 'success', text: `${count} feature${count !== 1 ? 's' : ''} retrieved` });
      }
    } catch (e) {
      setMessage({ type: 'error', text: e instanceof Error ? e.message : 'Retrieval failed' });
    } finally {
      setLoading(false);
      onLoadingChange?.(false);
    }
  }, [collection, geoIdText]);

  const handleExportGeoJson = useCallback(() => {
    if (!retrievedData) return;
    downloadBlob(
      new Blob([JSON.stringify(retrievedData, null, 2)], { type: 'application/geo+json' }),
      `features_${new Date().toISOString().split('T')[0]}.geojson`
    );
  }, [retrievedData]);

  const handleSubmitForAnalysis = useCallback(() => {
    if (!retrievedData) return;
    useStore.setState({
      preloadedGeojson: retrievedData,
      preloadedAnalysisOptions: { externalIdColumn: 'geoid' }
    });
    safePush('/');
  }, [retrievedData, safePush]);

  const handleClear = useCallback(() => {
    setGeoIdText('');
    setGeoIdFile('');
    setRetrievedData(null);
    setMessage(null);
  }, []);

  const rows: FeatureRow[] = useMemo(() => {
    if (!retrievedData) return [];
    return retrievedData.features.map((f, i) => ({
      index: i,
      geoId: String(f.id ?? ''),
      geometryType: f.geometry?.type ?? 'Unknown',
      properties: summarizeProperties(f.properties as Record<string, unknown>),
      status: 'retrieved' as const,
    }));
  }, [retrievedData]);

  if (retrievedData) {
    return (
      <div>
        <div className="mx-2 mb-4">
          {message && <Alert type={message.type} message={message.text} onClose={() => setMessage(null)} />}
        </div>
        <FeatureTable
          rows={rows}
          geoJsonData={retrievedData}
          toolbarActions={
            <div className="flex mt-2 justify-end">
              <div className="sm:m-2 ml-2 mr-0">
                <button onClick={handleExportGeoJson} className="w-auto p-2 bg-green-600 text-white rounded">
                  Export GeoJSON
                </button>
              </div>
              <div className="sm:m-2 ml-2 mr-0">
                <button onClick={handleSubmitForAnalysis} className="w-auto p-2 bg-green-600 text-white rounded">
                  Submit for Analysis
                </button>
              </div>
              <div className="sm:m-2 ml-2 mr-0">
                <button onClick={handleClear} className="w-24 p-2 bg-red-500 text-white rounded">
                  Clear
                </button>
              </div>
            </div>
          }
        />
      </div>
    );
  }

  return (
    <div>
      <div className="mx-2 mb-4">
        {message && <Alert type={message.type} message={message.text} onClose={() => setMessage(null)} />}
      </div>
      <p className="text-sm text-gray-400 mb-4 mx-2">
        Provide GeoIDs to retrieve registered features. Upload a .txt file or paste them below.
      </p>
      <div className="mx-2">
        <GeoIdInput
          value={geoIdText}
          onChange={setGeoIdText}
          fileName={geoIdFile}
          onFileNameChange={setGeoIdFile}
          onError={(msg) => setMessage({ type: 'error', text: msg })}
        />
      </div>
      <div className="flex mt-2 justify-end mx-2">
        <div className="sm:m-2">
          <button onClick={handleClear} className="w-24 p-2 bg-red-500 text-white rounded">
            Clear
          </button>
        </div>
        <div className="sm:m-2 ml-2 mr-0">
          <button
            onClick={handleRetrieve}
            className={`w-24 p-2 text-white rounded ${!hasGeoIds ? 'bg-green-200 cursor-not-allowed' : 'bg-green-600'}`}
            disabled={!hasGeoIds}
          >
            Retrieve
          </button>
        </div>
      </div>
    </div>
  );
}
