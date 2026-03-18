import type { Feature } from 'geojson';
import type {
  AssetRegistryClient,
  AssetRegistryConfig,
  CatalogInfo,
  CollectionInfo,
  GeoIdResolutionOptions,
} from './types';
import { SystemCode } from '@/types/systemCodes';
import { SystemError } from '@/types/systemError';

export class OgcFeaturesRegistryClient implements AssetRegistryClient {
  private config: AssetRegistryConfig;

  constructor(config: AssetRegistryConfig) {
    this.config = config;
  }

  async resolveGeoId(geoId: string, options: GeoIdResolutionOptions): Promise<Feature | null> {
    const { catalog, collection } = options;
    const url = `${this.config.baseUrl}/catalog/features/catalogs/${encodeURIComponent(catalog)}/collections/${encodeURIComponent(collection)}/items/${encodeURIComponent(geoId)}`;

    const response = await fetch(url, { method: 'GET' });

    if (!response.ok) {
      if (response.status >= 500) {
        throw new SystemError(SystemCode.SERVICE_ASSET_REGISTRY_UNAVAILABLE, undefined, `status: ${response.status}, geoId: ${geoId}`);
      }
      return null;
    }

    const data = await response.json();
    if (data?.type === 'Feature' && data?.geometry) {
      return data;
    }
    return null;
  }

  async listCatalogs(): Promise<CatalogInfo[]> {
    const url = `${this.config.baseUrl}/catalog/features/catalogs`;
    const response = await fetch(url, { method: 'GET' });

    if (!response.ok) {
      if (response.status >= 500) {
        throw new SystemError(SystemCode.SERVICE_ASSET_REGISTRY_UNAVAILABLE, undefined, `catalogs, status: ${response.status}`);
      }
      return [];
    }

    const data = await response.json();
    const catalogs = data?.catalogs ?? [];
    return catalogs.map((c: { id: string; title?: string; description?: string }) => ({
      id: c.id,
      title: c.title ?? null,
      description: c.description ?? null,
    }));
  }

  async listCollections(catalog: string): Promise<CollectionInfo[]> {
    const url = `${this.config.baseUrl}/catalog/features/catalogs/${encodeURIComponent(catalog)}/collections`;
    const response = await fetch(url, { method: 'GET' });

    if (!response.ok) {
      if (response.status >= 500) {
        throw new SystemError(SystemCode.SERVICE_ASSET_REGISTRY_UNAVAILABLE, undefined, `collections, status: ${response.status}`);
      }
      return [];
    }

    const data = await response.json();
    const collections = data?.collections ?? [];
    return collections.map((c: { id: string; title?: string; description?: string }) => ({
      id: c.id,
      title: c.title ?? null,
      description: c.description ?? null,
    }));
  }
}
