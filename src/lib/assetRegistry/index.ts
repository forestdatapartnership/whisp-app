import { OgcFeaturesRegistryClient } from './OgcFeaturesRegistryClient';
import type { AssetRegistryClient } from './types';
import { SystemCode } from '@/types/systemCodes';
import { SystemError } from '@/types/systemError';

export type { AssetRegistryClient, AssetRegistryConfig, GeoIdResolutionOptions, CatalogInfo, CollectionInfo } from './types';

export function createRegistryClient(): AssetRegistryClient {
  const baseUrl = process.env.ASSET_REGISTRY_BASE;

  if (!baseUrl) {
    throw new SystemError(SystemCode.SERVICE_ASSET_REGISTRY_NOT_CONFIGURED);
  }

  return new OgcFeaturesRegistryClient({
    baseUrl: baseUrl.replace(/\/$/, ''),
    defaultCatalog: process.env.ASSET_REGISTRY_DEFAULT_CATALOG ?? 'geoid',
    defaultCollection: process.env.ASSET_REGISTRY_DEFAULT_COLLECTION ?? 'test_coll',
  });
}
