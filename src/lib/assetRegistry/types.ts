import type { Feature } from 'geojson';
import type {
  CatalogInfo,
  CollectionInfo,
  FeatureListOptions,
  FeatureListResult,
  FeatureWritePayload,
} from '@/types/assetRegistry';

export type {
  CatalogInfo,
  CollectionInfo,
  FeatureListOptions,
  FeatureListResult,
  FeatureWritePayload,
} from '@/types/assetRegistry';

export interface AssetRegistryClient {
  resolveGeoId(geoId: string, collection: string): Promise<Feature | null>;
  listCatalogs(): Promise<CatalogInfo[]>;
  listCollections(): Promise<CollectionInfo[]>;
  listFeatures(collection: string, options?: FeatureListOptions): Promise<FeatureListResult>;
  createFeature(collection: string, payload: FeatureWritePayload): Promise<Feature>;
  updateFeature(collection: string, featureId: string, payload: FeatureWritePayload): Promise<Feature>;
  deleteFeature(collection: string, featureId: string): Promise<void>;
}

export interface AssetRegistryConfig {
  baseUrl: string;
  defaultCatalog: string;
  defaultCollection: string;
}
