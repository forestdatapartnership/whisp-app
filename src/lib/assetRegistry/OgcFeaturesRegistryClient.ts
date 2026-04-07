import type { Feature } from 'geojson';
import type {
  AssetRegistryClient,
  AssetRegistryConfig,
  CatalogInfo,
  CollectionInfo,
  FeatureListOptions,
  FeatureListResult,
  FeatureWritePayload,
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

  private isRetryableStatus(status: number): boolean {
    return status >= 500 || status === 408 || status === 429;
  }

  private async makeRequest(url: string, method: string = 'GET', body: unknown | null = null): Promise<any> {
    const init: RequestInit = { method };
    if (body != null) {
      init.headers = { 'Content-Type': 'application/geo+json' };
      init.body = JSON.stringify(body);
    }
    
    let cause: string | undefined;

    for (let attempt = 0; attempt < FETCH_MAX_ATTEMPTS; attempt++) {
      if (attempt > 0) await new Promise((r) => setTimeout(r, FETCH_RETRY_DELAY_MS));
      try {
        const response = await fetch(url, init);
        if (response.ok) return await response.json();
        if (method === 'GET' && response.status === 404) return null;


        const text = await response.text().catch(() => '');
        cause = `${response.status} ${text}`;
                  
        if (!this.isRetryableStatus(response.status)) {
          break;
        }
      } catch (e) {
        cause = `${e instanceof Error ? e.message : String(e)}`;
      }
    }

    throw new SystemError(SystemCode.SERVICE_ASSET_REGISTRY_UNAVAILABLE, undefined, 'Operation failed: ' + cause);
  }

  private itemsUrl(collection: string, featureId?: string): string {
    const catalog = this.config.defaultCatalog;
    let url = `${this.config.baseUrl}/catalog/features/catalogs/${encodeURIComponent(catalog)}/collections/${encodeURIComponent(collection)}/items`;
    if (featureId) url += `/${encodeURIComponent(featureId)}`;
    return url;
  }

  private toFeatureBody(payload: FeatureWritePayload): Record<string, unknown> {
    return {
      type: 'Feature',
      ...(payload.id != null ? { id: payload.id } : {}),
      geometry: payload.geometry,
      properties: payload.properties,
    };
  }

  async resolveGeoId(geoId: string, collection: string): Promise<Feature | null> {
    const url = this.itemsUrl(collection, geoId);
    const data = await this.makeRequest(url);
    if (data?.type === 'Feature' && data?.geometry) {
      return data;
    }
    return null;
  }

  async listCatalogs(): Promise<CatalogInfo[]> {
    const url = `${this.config.baseUrl}/catalog/features/catalogs`;
    const data = await this.makeRequest(url);
    const catalogs = data?.catalogs ?? [];
    return catalogs.map((c: { id: string; title?: string; description?: string }) => ({
      id: c.id,
      title: c.title ?? null,
      description: c.description ?? null,
    }));
  }

  async listCollections(): Promise<CollectionInfo[]> {
    const catalog = this.config.defaultCatalog;
    const url = `${this.config.baseUrl}/catalog/features/catalogs/${encodeURIComponent(catalog)}/collections`;
    const data = await this.makeRequest(url);
    const collections = data?.collections ?? [];
    return collections.map((c: { id: string; title?: string; description?: string }) => ({
      id: c.id,
      title: c.title ?? null,
      description: c.description ?? null,
    }));
  }

  async listFeatures(collection: string, options?: FeatureListOptions): Promise<FeatureListResult> {
    const params = new URLSearchParams();
    if (options?.limit != null) params.set('limit', String(options.limit));
    if (options?.offset != null) params.set('offset', String(options.offset));
    const qs = params.toString();
    const url = this.itemsUrl(collection) + (qs ? `?${qs}` : '');
    const data = await this.makeRequest(url);
    const features = data?.features ?? [];
    return {
      features,
      numberMatched: data?.numberMatched ?? 0,
      numberReturned: data?.numberReturned ?? features.length,
    };
  }

  async createFeature(collection: string, payload: FeatureWritePayload): Promise<Feature> {
    const url = this.itemsUrl(collection);
    const body = this.toFeatureBody(payload);
    const data = await this.makeRequest(url, 'POST', body);
    return data;
  }

  async updateFeature(collection: string, featureId: string, payload: FeatureWritePayload): Promise<Feature> {
    const url = this.itemsUrl(collection, featureId);
    const body = this.toFeatureBody({ ...payload, id: featureId });
    const data = await this.makeRequest(url, 'PUT', body);
    return data;
  }

  async deleteFeature(collection: string, featureId: string): Promise<void> {
    const url = this.itemsUrl(collection, featureId);
    await this.makeRequest(url, 'DELETE');
  }
}
