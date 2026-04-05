import type { Feature } from 'geojson';
import type {
  GeoIdResolutionOptions,
  CatalogInfo,
  CollectionInfo,
  FeatureListOptions,
  FeatureListResult,
  FeatureWritePayload,
} from '@/types/assetRegistry';

export type {
  GeoIdResolutionOptions,
  CatalogInfo,
  CollectionInfo,
  FeatureListOptions,
  FeatureListResult,
  FeatureWritePayload,
} from '@/types/assetRegistry';

export interface AssetRegistryClient {
  resolveGeoId(geoId: string, options: GeoIdResolutionOptions): Promise<Feature | null>;
  listCatalogs(): Promise<CatalogInfo[]>;
  listCollections(catalog: string): Promise<CollectionInfo[]>;
  listFeatures(catalog: string, collection: string, options?: FeatureListOptions): Promise<FeatureListResult>;
  createFeature(catalog: string, collection: string, payload: FeatureWritePayload): Promise<Feature>;
  updateFeature(catalog: string, collection: string, featureId: string, payload: FeatureWritePayload): Promise<Feature>;
  deleteFeature(catalog: string, collection: string, featureId: string): Promise<void>;
}

export interface AssetRegistryConfig {
  baseUrl: string;
  defaultCatalog: string;
  defaultCollection: string;
}
