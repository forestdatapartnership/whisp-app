export interface GeoIdResolutionOptions {
  catalog: string;
  collection: string;
}

export interface AssetRegistryOptions {
  catalog?: string;
  collection?: string;
}

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
