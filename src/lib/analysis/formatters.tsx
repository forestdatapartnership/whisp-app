import type { ReactNode } from "react";
import { formatDateTime, truncateString } from "@/lib/utils/formatters";

const TRUNCATE_THRESHOLD = 30;
const TRUNCATE_LIMIT = 20;

const COLUMN_ABBREVIATIONS: Record<string, string> = {
  def: "Deforestation",
  deg: "Degradation",
  undist: "Undisturbed",
  lon: "Longitude",
  lat: "Latitude",
  Ind: "Indicator",
  TC: "Tree Cover",
  treecover: "Tree Cover",
  nat: "Natural",
  reg: "Regenerating",
  pcrop: "P.Crop",
  acrop: "A.Crop",
};

export function formatColumnName(columnName: string, customDisplayName?: string): string {
  if (customDisplayName) return customDisplayName;

  let result = columnName
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/_/g, " ");

  for (const [abbr, full] of Object.entries(COLUMN_ABBREVIATIONS)) {
    result = result.replace(new RegExp(`\\b${abbr}\\b`, "gi"), full);
  }

  return result
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function formatNumber(column: string, value: number): string {
  const col = column.toLowerCase();
  const isCoordinate = col.includes("lat") || col.includes("lon") || col.includes("centroid");
  if (isCoordinate) return String(value);
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
    useGrouping: true,
  }).format(value);
}

export function formatCellValue(column: string, value: unknown): ReactNode {
  if (value === null || value === undefined) return "na";

  if (typeof value === "object") {
    try {
      if (column === "geojson" || column === "geo" || ((value as any).type && ((value as any).coordinates || (value as any).geometries))) {
        return `[${(value as any).type} Geometry]`;
      }
      if (value instanceof Date) return formatDateTime(value);
      if (Array.isArray(value)) {
        if (!value.length) return "[]";
        if (value.length > 3) return `[${value.slice(0, 3).join(", ")}... +${value.length - 3} more]`;
        return `[${value.join(", ")}]`;
      }
      return JSON.stringify(value);
    } catch {
      return "[Complex Object]";
    }
  }

  if (typeof value === "boolean") return value ? "true" : "false";
  if (typeof value === "number") return formatNumber(column, value);

  if (typeof value === "string" && (column === "geoid" || column === "WDPA") && !value.trim()) {
    return "na";
  }

  const text = String(value);
  if (text.length > TRUNCATE_THRESHOLD) {
    return <span title={text}>{truncateString(text, TRUNCATE_LIMIT)}</span>;
  }

  return text;
}
