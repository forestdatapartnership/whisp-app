import { OgcFeaturesRegistryClient } from './OgcFeaturesRegistryClient';
import type { AssetRegistryClient } from './types';
import { config } from '@/lib/config';
import { SystemCode } from '@/types/systemCodes';
import { SystemError } from '@/types/systemError';

export type {
  AssetRegistryClient,
  AssetRegistryConfig,
  GeoIdResolutionOptions,
  CatalogInfo,
  CollectionInfo,
  FeatureListOptions,
  FeatureListResult,
  FeatureWritePayload,
} from './types';

export function createRegistryClient(): AssetRegistryClient {
  if (!config.assetRegistry.baseUrl) {
    throw new SystemError(SystemCode.SERVICE_ASSET_REGISTRY_NOT_CONFIGURED);
  }

  return new OgcFeaturesRegistryClient({
    baseUrl: config.assetRegistry.baseUrl,
    defaultCatalog: config.assetRegistry.defaultCatalog,
    defaultCollection: config.assetRegistry.defaultCollection,
  });
}
