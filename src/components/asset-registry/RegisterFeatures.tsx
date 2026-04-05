'use client';

import { useState, useCallback, useMemo } from 'react';
import type { Feature, FeatureCollection } from 'geojson';
import { useConfig } from '@/lib/contexts/ConfigContext';
import { getMaxGeometryLimit } from '@/lib/utils/configUtils';
import { FileInput } from '@/components/submission/FileInput';
import Alert from '@/components/shared/Alert';
import { parseGeoJsonFile } from '@/lib/utils/fileParser';
import { registerFeatureBatchAction } from '@/lib/assetRegistry/actions';
import { downloadBlob } from '@/lib/utils/downloadFile';
import FeatureTable, { summarizeProperties } from '@/components/asset-registry/FeatureTable';
import type { FeatureRow } from '@/components/asset-registry/FeatureTable';
import type { FeatureWritePayload } from '@/types/assetRegistry';

const BATCH_SIZE = 100;

interface RegisterFeaturesProps {
  catalog: string;
  collection: string;
  onLoadingChange?: (loading: boolean) => void;
}

export default function RegisterFeatures({ catalog, collection, onLoadingChange }: RegisterFeaturesProps) {
  const { config } = useConfig();
  const maxGeometryLimit = useMemo(() => getMaxGeometryLimit(config), [config]);

  const [features, setFeatures] = useState<Feature[]>([]);
  const [rows, setRows] = useState<FeatureRow[]>([]);
  const [fileName, setFileName] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [registering, setRegistering] = useState(false);

  const registered = rows.some(r => r.status !== 'pending');
  const hasErrors = rows.some(r => r.status === 'error');

  const geoJsonData: FeatureCollection = useMemo(
    () => ({ type: 'FeatureCollection', features }),
    [features]
  );

  const handleFileParsed = useCallback(async (file: File) => {
    setMessage(null);
    setRows([]);
    setFeatures([]);

    try {
      const parsed = await parseGeoJsonFile(file);
      if (parsed.length === 0) {
        setMessage({ type: 'error', text: 'No features found in file' });
        setFileName('');
        return;
      }

      if (parsed.length > maxGeometryLimit) {
        setMessage({ type: 'error', text: `Too many features. Maximum allowed is ${maxGeometryLimit}.` });
        setFileName('');
        return;
      }

      setFeatures(parsed);
      setFileName(file.name);
      setRows(
        parsed.map((f, i) => ({
          index: i,
          geometryType: f.geometry?.type ?? 'Unknown',
          geoId: '—',
          properties: summarizeProperties(f.properties as Record<string, unknown>),
          status: 'pending',
        }))
      );
    } catch (e) {
      setMessage({ type: 'error', text: e instanceof Error ? e.message : 'Failed to parse file' });
      setFileName('');
    }
  }, [maxGeometryLimit]);

  const handleRegister = useCallback(async () => {
    if (features.length === 0) return;
    setRegistering(true);
    onLoadingChange?.(true);
    setMessage(null);

    const payloads: FeatureWritePayload[] = features.map((f) => ({
      id: f.id != null ? String(f.id) : undefined,
      geometry: f.geometry,
      properties: (f.properties ?? {}) as Record<string, unknown>,
    }));

    let processed = 0;

    for (let start = 0; start < payloads.length; start += BATCH_SIZE) {
      const batch = payloads.slice(start, start + BATCH_SIZE).map((feature, i) => ({
        index: start + i,
        feature,
      }));

      try {
        const results = await registerFeatureBatchAction(catalog, collection, batch);
        setRows(prev =>
          prev.map(row => {
            const result = results.find(r => r.index === row.index);
            if (!result) return row;
            return {
              ...row,
              geoId: result.generatedId || '—',
              status: result.status,
              error: result.error,
            };
          })
        );
      } catch (e) {
        setRows(prev =>
          prev.map(row => {
            if (row.index >= start && row.index < start + BATCH_SIZE && row.status === 'pending') {
              return { ...row, status: 'error', error: e instanceof Error ? e.message : 'Batch failed' };
            }
            return row;
          })
        );
      }

      processed += batch.length;
    }

    setRegistering(false);
    onLoadingChange?.(false);
  }, [features, catalog, collection, onLoadingChange]);

  const handleClear = useCallback(() => {
    setFeatures([]);
    setRows([]);
    setFileName('');
    setMessage(null);
  }, []);

  const handleDownloadGeoIds = useCallback(() => {
    const ids = rows.filter(r => r.status === 'created' && r.geoId !== '—').map(r => r.geoId);
    if (ids.length === 0) return;
    downloadBlob(
      new Blob([ids.join('\n')], { type: 'text/plain' }),
      `geoids_${new Date().toISOString().split('T')[0]}.txt`
    );
  }, [rows]);

  const createdCount = rows.filter(r => r.status === 'created').length;
  const errorCount = rows.filter(r => r.status === 'error').length;

  if (registered) {
    return (
      <div>
        <div className="mx-2 mb-4">
          {message && <Alert type={message.type} message={message.text} onClose={() => setMessage(null)} />}
          <div className="text-sm text-gray-300 mt-2">
            {createdCount > 0 && <span className="text-green-400 mr-4">{createdCount} created</span>}
            {errorCount > 0 && <span className="text-red-400">{errorCount} failed</span>}
          </div>
        </div>
        <FeatureTable
          rows={rows}
          geoJsonData={geoJsonData}
          showErrors={hasErrors}
          toolbarActions={
            <div className="flex mt-2 justify-end">
              {createdCount > 0 && (
                <div className="sm:m-2 ml-2 mr-0">
                  <button onClick={handleDownloadGeoIds} className="w-auto p-2 bg-green-600 text-white rounded">
                    Download GeoIDs
                  </button>
                </div>
              )}
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

  if (rows.length > 0) {
    return (
      <div>
        <div className="mx-2 mb-4">
          {message && <Alert type={message.type} message={message.text} onClose={() => setMessage(null)} />}
        </div>
        <FeatureTable
          rows={rows}
          geoJsonData={geoJsonData}
          toolbarActions={
            <div className="flex mt-2 justify-end">
              <div className="sm:m-2 ml-2 mr-0">
                <button onClick={handleRegister} className="w-auto p-2 bg-green-600 text-white rounded">
                  Register {features.length} Feature{features.length !== 1 ? 's' : ''}
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
      <div className="p-2">
        <p className="text-sm text-gray-400 mb-4 mx-2">
          Upload a GeoJSON file. Each feature will be registered and assigned a GeoID.
        </p>
        <FileInput
          innerMessage=".json or .geojson"
          accept={{ 'application/json': ['.json', '.geojson'] }}
          handleFileChange={handleFileParsed}
          fileName={fileName}
          onError={(msg) => setMessage({ type: 'error', text: msg })}
        />
      </div>
    </div>
  );
}
