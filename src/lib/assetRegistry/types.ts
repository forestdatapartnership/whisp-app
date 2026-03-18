import type { Feature } from 'geojson';
import type { GeoIdResolutionOptions, CatalogInfo, CollectionInfo } from '@/types/assetRegistry';

export type { GeoIdResolutionOptions, CatalogInfo, CollectionInfo } from '@/types/assetRegistry';

export interface AssetRegistryClient {
  resolveGeoId(geoId: string, options: GeoIdResolutionOptions): Promise<Feature | null>;
  listCatalogs(): Promise<CatalogInfo[]>;
  listCollections(catalog: string): Promise<CollectionInfo[]>;
}

export interface AssetRegistryConfig {
  baseUrl: string;
  defaultCatalog: string;
  defaultCollection: string;
}
