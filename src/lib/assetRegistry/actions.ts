'use server';

import { createRegistryClient } from '@/lib/assetRegistry';
import type { CatalogInfo, CollectionInfo } from '@/types/assetRegistry';

export async function fetchCatalogs(): Promise<CatalogInfo[]> {
  const client = createRegistryClient();
  return client.listCatalogs();
}

export async function fetchCollections(catalog: string): Promise<CollectionInfo[]> {
  const client = createRegistryClient();
  return client.listCollections(catalog);
}
