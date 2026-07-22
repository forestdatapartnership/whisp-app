import type { FeatureCollection } from "geojson";

type LocalResults = {
  featureCollection: FeatureCollection;
  whispVersion: string | null;
};

let pending: LocalResults | null = null;

export function storeLocalResults(
  featureCollection: FeatureCollection,
  whispVersion: string | null
) {
  pending = { featureCollection, whispVersion };
}

export function readLocalResults(): LocalResults | null {
  return pending;
}

export function clearLocalResults() {
  pending = null;
}
