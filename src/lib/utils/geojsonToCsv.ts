import type { FeatureCollection, Feature } from "geojson";

function toCsvValue(value: unknown): string {
  if (value === null || value === undefined) return "null";
  if (typeof value === "boolean") return value ? "true" : "false";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

function getServerColumnOrder(properties: Record<string, unknown>): string[] {
  const keys = Object.keys(properties);
  const whispIdx = keys.indexOf("whisp_processing_metadata");
  if (whispIdx >= 0) {
    return [...keys.slice(0, whispIdx), "geo", ...keys.slice(whispIdx)];
  }
  return [...keys, "geo"];
}

export function geojsonToServerCsvFormat(
  geoJson: FeatureCollection
): { header: string[]; rows: (string | number)[][] } {
  const features = geoJson.features ?? [];
  if (features.length === 0) return { header: [], rows: [] };

  const firstProps = (features[0] as Feature)?.properties ?? {};
  const header = getServerColumnOrder(firstProps as Record<string, unknown>);

  const rows = features.map((f) => {
    const feature = f as Feature;
    const props = feature.properties ?? {};
    return header.map((col) => {
      if (col === "geo") {
        return toCsvValue(feature.geometry);
      }
      const val = col in props ? props[col] : null;
      return toCsvValue(val);
    });
  });

  return { header, rows };
}
