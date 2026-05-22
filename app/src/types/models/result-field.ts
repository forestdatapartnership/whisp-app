import type { AuditedModel } from './base';

export interface CommodityMetadata {
  usedForRisk?: boolean | null;
  dataTheme?: string;
}

export interface CommodityMetadataMap {
  [key: string]: CommodityMetadata | undefined;
}

export interface PowerBiMetadata {
  dashboard?: boolean;
}

export interface DisplayMetadata {
  displayName?: string;
  excludeFromResults?: boolean;
  visibleByDefault?: boolean;
}

export interface AnalysisMetadata {
  type?: string;
  excludeFromOutput?: boolean;
  isNullable?: boolean;
  isRequired?: boolean;
  correspondingVariable?: string;
  geeAssets?: string[];
}

export interface ResultField extends AuditedModel {
  type?: string;
  unit?: string;
  description?: string;
  category?: string;
  order?: number;
  iso2Code?: string;
  period?: string;
  source?: string;
  comments?: string;
  powerBiMetadata?: PowerBiMetadata;
  commodityMetadata?: CommodityMetadataMap;
  displayMetadata?: DisplayMetadata;
  analysisMetadata?: AnalysisMetadata;
}

export type ResultFieldsMap = Record<string, ResultField>;
