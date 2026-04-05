import type { FeatureCollection } from "geojson";
import { geojsonToServerCsvFormat } from "./geojsonToCsv";
import { downloadBlob } from "./downloadFile";

export function timestampFilename(ext: string, suffix?: string): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const base = `whisp_analysis_${year}_${month}_${day}_${hours}_${minutes}`;
  const suffixPart = suffix ? `-${suffix}` : '';
  return `${base}${suffixPart}.${ext}`;
}

function escapeCSV(value: string | number): string {
  const s = String(value ?? '');
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export function buildCsvString(header: string[], rows: (string | number)[][]): string {
  const escapeRow = (row: (string | number)[]) => row.map(escapeCSV).join(',');
  return [header.join(','), ...rows.map(escapeRow)].join('\n');
}

export function geoJsonFeatureCollectionToCsvString(geojson: FeatureCollection): string | null {
  const { header, rows } = geojsonToServerCsvFormat(geojson);
  if (!header.length) return null;
  return buildCsvString(header, rows);
}

export function downloadCsv(csv: string, filename: string): void {
  downloadBlob(new Blob([csv], { type: 'text/csv;charset=utf-8;' }), filename);
}
