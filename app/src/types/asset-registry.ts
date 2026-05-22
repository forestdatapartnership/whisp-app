import type { Feature, Geometry } from 'geojson';

export interface CatalogInfo {
  id: string;
  title: string | null;
  description: string | null;
}

export interface CollectionInfo {
  id: string;
  title: string | null;
  description: string | null;
}

export interface FeatureListOptions {
  limit?: number;
  offset?: number;
}

export interface FeatureListResult {
  features: Feature[];
  numberMatched: number;
  numberReturned: number;
}

export interface FeatureWritePayload {
  id?: string;
  geometry: Geometry;
  properties: Record<string, unknown>;
}

export interface BulkCreateResultItem {
  index: number;
  inputId: string;
  generatedId: string;
  status: 'created' | 'error';
  error?: string;
}

export interface BulkRetrieveResultItem {
  index: number;
  geoId: string;
  feature?: Feature;
  status: 'retrieved' | 'not_found' | 'error';
  error?: string;
}
