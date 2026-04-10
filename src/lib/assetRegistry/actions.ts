'use server';

import type { Feature } from 'geojson';
import { createRegistryClient } from '@/lib/assetRegistry';
import { config } from '@/lib/config';
import { requireAuth } from '@/lib/auth';
import type { CatalogInfo, CollectionInfo, FeatureWritePayload, BulkCreateResultItem, BulkRetrieveResultItem } from '@/types/assetRegistry';

function withWhispMetadata(properties: Record<string, unknown>): Record<string, unknown> {
  return { ...properties, _whisp: { version: config.app.version } };
}

export async function fetchCatalogs(): Promise<CatalogInfo[]> {
  const client = createRegistryClient();
  return client.listCatalogs();
}

export async function fetchCollections(): Promise<CollectionInfo[]> {
  const client = createRegistryClient();
  return client.listCollections();
}

export async function registerFeatureBatchAction(
  collection: string,
  batch: { index: number; feature: FeatureWritePayload }[]
): Promise<BulkCreateResultItem[]> {
  await requireAuth();

  const client = createRegistryClient();
  const results: BulkCreateResultItem[] = [];

  for (const { index, feature } of batch) {
    try {
      const created = await client.createFeature(collection, {
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

export async function retrieveFeatureBatchAction(
  collection: string,
  batch: { index: number; geoId: string }[]
): Promise<BulkRetrieveResultItem[]> {
  await requireAuth();

  const client = createRegistryClient();
  const results: BulkRetrieveResultItem[] = [];

  for (const { index, geoId } of batch) {
    try {
      const feature = await client.resolveGeoId(geoId, collection);
      if (feature) {
        results.push({
          index,
          geoId,
          feature: { ...feature, properties: { ...feature.properties, geoid: geoId } },
          status: 'retrieved',
        });
      } else {
        results.push({ index, geoId, status: 'not_found' });
      }
    } catch (e) {
      results.push({
        index,
        geoId,
        status: 'error',
        error: e instanceof Error ? e.message : 'Unknown error',
      });
    }
  }

  return results;
}

