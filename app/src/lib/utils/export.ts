import type { FeatureCollection } from 'geojson';

function escapeCsv(value: unknown): string {
  const s = value == null ? '' : String(value);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function rowsToCsv(columns: string[], rows: Record<string, unknown>[]): string {
  const header = columns.map(escapeCsv).join(',');
  const body = rows.map((row) => columns.map((c) => escapeCsv(row[c])).join(','));
  return [header, ...body].join('\n');
}

export function downloadCsv(columns: string[], rows: Record<string, unknown>[], filename: string) {
  downloadBlob(new Blob([rowsToCsv(columns, rows)], { type: 'text/csv;charset=utf-8' }), filename);
}

export function downloadGeoJson(fc: FeatureCollection, filename: string) {
  downloadBlob(new Blob([JSON.stringify(fc, null, 2)], { type: 'application/geo+json' }), filename);
}

export function downloadHtml(html: string, filename: string) {
  downloadBlob(new Blob([html], { type: 'text/html;charset=utf-8' }), filename);
}

export function timestampFilename(ext: string, suffix?: string) {
  const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  return `whisp-${suffix ? `${suffix}-` : ''}${ts}.${ext}`;
}
