'use client';

import { useState, useCallback, useMemo } from 'react';
import type { Feature, FeatureCollection } from 'geojson';
import { useStore } from '@/store';
import { useSafeRouterPush } from '@/lib/hooks/useSafeRouterPush';
import { GeoIdInput } from '@/components/submission/GeoIdInput';
import Alert from '@/components/shared/Alert';
import { retrieveFeatureBatchAction } from '@/lib/assetRegistry/actions';
import { parseGeoIdText } from '@/lib/utils/fileParser';
import { downloadBlob } from '@/lib/utils/downloadFile';
import FeatureTable, { summarizeProperties } from '@/components/asset-registry/FeatureTable';
import type { FeatureRow } from '@/components/asset-registry/FeatureTable';
import type { ProgressData } from '@/components/shared/StatusCard';
import { getBatchSize } from '@/lib/assetRegistry/batchUtils';

interface RetrieveFeaturesProps {
  collection: string;
  onLoadingChange?: (loading: boolean, count?: number) => void;
  onProgressUpdate?: (progress: ProgressData | null) => void;
}

export default function RetrieveFeatures({ collection, onLoadingChange, onProgressUpdate }: RetrieveFeaturesProps) {
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
    onLoadingChange?.(true, ids.length);
    setMessage(null);
    setRetrievedData(null);

    const batchSize = getBatchSize(ids.length);
    const totalBatches = Math.ceil(ids.length / batchSize);
    const messages: string[] = [];
    let processed = 0;
    const allFeatures: Feature[] = [];
    const notFound: string[] = [];
    let hadError = false;

    messages.push(`Starting retrieval of ${ids.length} GeoID${ids.length !== 1 ? 's' : ''} in ${totalBatches} batch${totalBatches !== 1 ? 'es' : ''}`);
    onProgressUpdate?.({ percent: 0, processStatusMessages: [...messages] });

    for (let start = 0; start < ids.length; start += batchSize) {
      const batchNum = Math.floor(start / batchSize) + 1;
      const batchIds = ids.slice(start, start + batchSize);
      const batch = batchIds.map((geoId, i) => ({ index: start + i, geoId }));

      const percent = Math.round((processed / ids.length) * 100);
      messages.push(`Progress: ${batchNum}/${totalBatches} batches (${percent}%)`);
      onProgressUpdate?.({ percent, processStatusMessages: [...messages] });

      try {
        const results = await retrieveFeatureBatchAction(collection, batch);
        const retrieved = results.filter(r => r.status === 'retrieved');
        const missing = results.filter(r => r.status === 'not_found');
        const errors = results.filter(r => r.status === 'error');

        for (const r of retrieved) {
          if (r.feature) allFeatures.push(r.feature);
        }
        for (const r of missing) notFound.push(r.geoId);
        if (errors.length > 0) hadError = true;

      } catch (e) {
        hadError = true;
        messages.push(`Batch ${batchNum}/${totalBatches} failed: ${e instanceof Error ? e.message : 'Unknown error'}`);
      }

      processed += batchIds.length;
      onProgressUpdate?.({ percent: Math.round((processed / ids.length) * 100), processStatusMessages: [...messages] });
    }

    if (hadError && allFeatures.length === 0) {
      setMessage({ type: 'error', text: 'Retrieval failed' });
    } else if (notFound.length > 0) {
      setMessage({ type: 'error', text: `GeoIDs not found: ${notFound.join(', ')}` });
    } else {
      const fc: FeatureCollection = { type: 'FeatureCollection', features: allFeatures };
      setRetrievedData(fc);
      setMessage({ type: 'success', text: `${allFeatures.length} feature${allFeatures.length !== 1 ? 's' : ''} retrieved` });
    }

    setLoading(false);
    onLoadingChange?.(false);
  }, [collection, geoIdText, onLoadingChange, onProgressUpdate]);

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
