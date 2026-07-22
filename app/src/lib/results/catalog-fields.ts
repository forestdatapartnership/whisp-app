import type { CommodityMetadataMap } from "@/types/models";

export const RISK_PICKER_CATEGORIES = new Set([
  "Context and metadata",
  "Analysis results",
  "Plot location",
]);

export type RiskValue = "low" | "more_info_needed" | "high";
export type RiskTone = "low" | "medium" | "high";

export interface CatalogColumn {
  key: string;
  header: string;
  category?: string;
  description?: string;
  commodityMetadata?: CommodityMetadataMap;
}

export interface RiskFilter {
  field: string;
  value: RiskValue;
}

export function isRiskColumn(col: CatalogColumn): boolean {
  return (
    (col.category != null && RISK_PICKER_CATEGORIES.has(col.category)) ||
    Object.values(col.commodityMetadata ?? {}).some((m) => m?.usedForRisk === true)
  );
}

export function riskToneToValue(tone: RiskTone): RiskValue {
  return tone === "medium" ? "more_info_needed" : tone;
}

export function riskValueToTone(value: string): RiskTone | null {
  if (value === "low" || value === "high") return value;
  if (value === "more_info_needed") return "medium";
  return null;
}

export function riskValueLabel(value: RiskValue): string {
  if (value === "more_info_needed") return "More info needed";
  if (value === "high") return "High risk";
  return "Low risk";
}

export function isTruthyCell(value: unknown): boolean {
  if (value === true) return true;
  if (typeof value === "string") {
    const v = value.toLowerCase();
    return v === "yes" || v === "true";
  }
  return false;
}

export function isYesNoCell(value: unknown): boolean {
  if (typeof value === "boolean") return true;
  if (typeof value !== "string") return false;
  const v = value.toLowerCase();
  return v === "yes" || v === "no" || v === "true" || v === "false";
}

export interface RiskMix {
  low: number;
  medium: number;
  high: number;
  total: number;
}

export function computeRiskMix(
  rows: Array<Record<string, unknown>>,
  field: string
): RiskMix {
  const mix: RiskMix = { low: 0, medium: 0, high: 0, total: rows.length };
  for (const row of rows) {
    const tone = riskValueToTone(String(row[field] ?? ""));
    if (tone) mix[tone]++;
  }
  return mix;
}

export function countTruthy(rows: Array<Record<string, unknown>>, field: string): number {
  let n = 0;
  for (const row of rows) if (isTruthyCell(row[field])) n++;
  return n;
}
