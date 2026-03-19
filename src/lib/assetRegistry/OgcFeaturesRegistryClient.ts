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

const FETCH_RETRY_DELAY_MS = 500;
const FETCH_MAX_ATTEMPTS = 2;

export class OgcFeaturesRegistryClient implements AssetRegistryClient {
  private config: AssetRegistryConfig;

  constructor(config: AssetRegistryConfig) {
    this.config = config;
  }

  private async fetchWithRetry(url: string): Promise<Response> {
    for (let attempt = 0; attempt < FETCH_MAX_ATTEMPTS; attempt++) {
      if (attempt > 0) {
        await new Promise((resolve) => setTimeout(resolve, FETCH_RETRY_DELAY_MS));
      }

      try {
        const response = await fetch(url, { method: 'GET' });
        if (!response.ok && response.status >= 500) {
          if (attempt === FETCH_MAX_ATTEMPTS - 1) {
            throw new SystemError(
              SystemCode.SERVICE_ASSET_REGISTRY_UNAVAILABLE,
              undefined,
              `${response.status} ${url}`
            );
          }
          continue;
        }
        return response;
      } catch (e) {
        if (e instanceof SystemError) throw e;
        if (attempt === FETCH_MAX_ATTEMPTS - 1) {
          throw new SystemError(SystemCode.SERVICE_ASSET_REGISTRY_UNAVAILABLE, undefined, url);
        }
      }
    }

    throw new SystemError(SystemCode.SERVICE_ASSET_REGISTRY_UNAVAILABLE, undefined, url);
  }

  async resolveGeoId(geoId: string, options: GeoIdResolutionOptions): Promise<Feature | null> {
    const { catalog, collection } = options;
    const url = `${this.config.baseUrl}/catalog/features/catalogs/${encodeURIComponent(catalog)}/collections/${encodeURIComponent(collection)}/items/${encodeURIComponent(geoId)}`;
    const response = await this.fetchWithRetry(url);

    if (!response.ok) {
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
    const response = await this.fetchWithRetry(url);

    if (!response.ok) {
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
    const response = await this.fetchWithRetry(url);

    if (!response.ok) {
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
