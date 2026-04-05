'use server';

import type { Feature, FeatureCollection } from 'geojson';
import { createRegistryClient } from '@/lib/assetRegistry';
import { getAppVersion } from '@/lib/utils/configUtils';
import { requireAuth } from '@/lib/auth';
import type { CatalogInfo, CollectionInfo, FeatureWritePayload, BulkCreateResultItem } from '@/types/assetRegistry';

function withWhispMetadata(properties: Record<string, unknown>): Record<string, unknown> {
  return { ...properties, _whisp: { version: getAppVersion() } };
}

export async function fetchCatalogs(): Promise<CatalogInfo[]> {
  const client = createRegistryClient();
  return client.listCatalogs();
}

export async function fetchCollections(catalog: string): Promise<CollectionInfo[]> {
  const client = createRegistryClient();
  return client.listCollections(catalog);
}

export async function registerFeatureBatchAction(
  catalog: string,
  collection: string,
  batch: { index: number; feature: FeatureWritePayload }[]
): Promise<BulkCreateResultItem[]> {
  await requireAuth();

  const client = createRegistryClient();
  const results: BulkCreateResultItem[] = [];

  for (const { index, feature } of batch) {
    try {
      const created = await client.createFeature(catalog, collection, {
        ...feature,
        properties: withWhispMetadata(feature.properties),
      });
      results.push({
        index,
        inputId: feature.id ?? '',
        generatedId: String(created.id ?? ''),
        status: 'created',
      });
    } catch (e) {
      results.push({
        index,
        inputId: feature.id ?? '',
        generatedId: '',
        status: 'error',
        error: e instanceof Error ? e.message : 'Unknown error',
      });
    }
  }

  return results;
}

export async function retrieveFeaturesByGeoIds(
  catalog: string,
  collection: string,
  geoIds: string[]
): Promise<{ ok: boolean; featureCollection?: FeatureCollection; error?: string }> {
  try {
    await requireAuth();
  } catch {
    return { ok: false, error: 'Authentication required' };
  }

  try {
    const client = createRegistryClient();
    const features: Feature[] = [];
    const notFound: string[] = [];

    for (const geoId of geoIds) {
      const feature = await client.resolveGeoId(geoId, { catalog, collection });
      if (feature) {
        features.push(feature);
      } else {
        notFound.push(geoId);
      }
    }

    if (notFound.length > 0) {
      return { ok: false, error: `GeoIDs not found: ${notFound.join(', ')}` };
    }

    return {
      ok: true,
      featureCollection: { type: 'FeatureCollection', features },
    };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Retrieval failed' };
  }
}
