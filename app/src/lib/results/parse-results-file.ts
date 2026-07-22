import type { Feature, FeatureCollection } from "geojson";

type ParseResultsResult =
  | { featureCollection: FeatureCollection; whispVersion: string | null }
  | { error: string };

export function versionsMatch(
  exported: string | null | undefined,
  current: string | null | undefined
) {
  const a = exported?.trim() || "";
  const b = current?.trim() || "";
  return Boolean(a && b && a === b);
}

function parseMeta(raw: unknown): Record<string, unknown> | null {
  if (raw == null) return null;
  if (typeof raw === "object" && !Array.isArray(raw)) {
    return raw as Record<string, unknown>;
  }
  if (typeof raw !== "string") return null;
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }
  } catch {
    return null;
  }
  return null;
}

function whispVersionFrom(fc: FeatureCollection): string | null {
  for (const f of fc.features) {
    const meta = parseMeta(
      (f.properties as Record<string, unknown> | null)?.whisp_processing_metadata
    );
    const version = meta?.whisp_version;
    if (version != null && version !== "") return String(version);
  }
  return null;
}

function asFeatureCollection(data: unknown): ParseResultsResult {
  if (!data || typeof data !== "object") {
    return { error: "Invalid GeoJSON format." };
  }

  const obj = data as Record<string, unknown>;
  let featureCollection: FeatureCollection;

  if (obj.type === "FeatureCollection" && Array.isArray(obj.features)) {
    featureCollection = data as FeatureCollection;
  } else if (obj.type === "Feature") {
    featureCollection = { type: "FeatureCollection", features: [data as Feature] };
  } else {
    return { error: "Expected a GeoJSON FeatureCollection or Feature." };
  }

  if (!featureCollection.features.length) {
    return { error: "GeoJSON has no features." };
  }
  if (featureCollection.features.some((f) => f.geometry == null)) {
    return { error: "All features must include geometry." };
  }

  return {
    featureCollection,
    whispVersion: whispVersionFrom(featureCollection),
  };
}

export function parseResultsFile(file: File): Promise<ParseResultsResult> {
  return new Promise((resolve) => {
    const name = file.name.toLowerCase();
    if (!name.endsWith(".geojson") && !name.endsWith(".json")) {
      resolve({ error: "Unsupported file format. Use a WHISP GeoJSON export." });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result;
      if (typeof text !== "string") {
        resolve({ error: "Error reading the file." });
        return;
      }
      if (!text.trim()) {
        resolve({ error: "File is empty." });
        return;
      }
      try {
        resolve(asFeatureCollection(JSON.parse(text)));
      } catch {
        resolve({ error: "Invalid GeoJSON format." });
      }
    };
    reader.onerror = () => resolve({ error: "Error reading the file." });
    reader.readAsText(file);
  });
}
