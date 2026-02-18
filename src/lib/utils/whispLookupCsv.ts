import type { ResultField, Commodity } from '@/types/models';

const WHISP_CSV_HEADER = 'name,order,ISO2_code,theme,theme_timber,use_for_risk,use_for_risk_timber,exclude_from_output,col_type,is_nullable,is_required,corresponding_variable';

const WHISP_THEMES = new Set(['context_and_metadata', 'treecover', 'commodities', 'disturbance_before', 'disturbance_after', 'NA']);

function normalizeTheme(val: string | undefined): string {
  if (!val) return 'NA';
  const lower = val.toLowerCase();
  if (WHISP_THEMES.has(val)) return val;
  if (lower === 'context_and_metadata' || lower === 'treecover' || lower === 'commodities') return lower;
  if (lower.includes('disturbance')) return lower.includes('after') ? 'disturbance_after' : 'disturbance_before';
  return 'NA';
}

const CONTEXT_CORRESPONDING_VARS = new Set([
  'plot_id_column',
  'external_id_column',
  'geometry_area_column',
  'geometry_type_column',
  'iso3_country_column',
  'iso2_country_column',
  'admin_1_column',
  'centroid_x_coord_column',
  'centroid_y_coord_column',
  'stats_unit_type_column',
  'water_flag',
  'geometry_column',
]);

export function isContextField(field: ResultField): boolean {
  if (field.category === 'context_and_metadata') return true;
  const cv = field.analysisMetadata?.correspondingVariable;
  return !!cv && (CONTEXT_CORRESPONDING_VARS.has(cv) || cv.endsWith('_column'));
}

export function isGeeField(field: ResultField): boolean {
  return !isContextField(field);
}

function useForRiskFromAcropPcrop(field: ResultField): string {
  const meta = field.commodityMetadata;
  if (!meta) return '';
  const acrop = meta.acrop?.usedForRisk;
  const pcrop = meta.pcrop?.usedForRisk;
  if (acrop === true || pcrop === true) return '1';
  if (acrop === false || pcrop === false) return '0';
  return '';
}

function themeFromAcropPcrop(field: ResultField): string {
  const meta = field.commodityMetadata;
  if (!meta) return '';
  return meta.acrop?.dataTheme ?? meta.pcrop?.dataTheme ?? '';
}

function toCsvValue(v: string | number | boolean | undefined | null): string {
  if (v == null || v === '') return '';
  if (typeof v === 'boolean') return v ? '1' : '0';
  const s = String(v);
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export function toWhispCsvRow(field: ResultField, commodities: Commodity[]): string[] {
  const isContext = isContextField(field);
  const rawTheme = isContext ? 'context_and_metadata' : (themeFromAcropPcrop(field) || field.category);
  const theme = normalizeTheme(rawTheme);
  const themeTimber = isContext ? 'context_and_metadata' : toCsvValue(field.commodityMetadata?.timber?.dataTheme);
  const useForRisk = isContext ? 'NA' : (useForRiskFromAcropPcrop(field) || '');
  const useForRiskTimber = isContext ? 'NA' : toCsvValue(field.commodityMetadata?.timber?.usedForRisk === true ? '1' : field.commodityMetadata?.timber?.usedForRisk === false ? '0' : undefined);
  const excludeFromOutput = field.analysisMetadata?.excludeFromOutput ? '1' : '0';
  const colType = field.analysisMetadata?.type ?? 'float32';
  const isNullable = field.analysisMetadata?.isNullable !== false ? '1' : '0';
  const isRequired = field.analysisMetadata?.isRequired ? '1' : '0';
  const correspondingVariable = field.analysisMetadata?.correspondingVariable ?? '';

  return [
    toCsvValue(field.code),
    String(field.order ?? 0),
    toCsvValue(field.iso2Code),
    theme,
    themeTimber,
    useForRisk,
    useForRiskTimber,
    excludeFromOutput,
    colType,
    isNullable,
    isRequired,
    toCsvValue(correspondingVariable),
  ];
}

export function buildWhispCsv(
  fields: ResultField[],
  commodities: Commodity[],
  filter: (f: ResultField) => boolean
): string {
  const filtered = fields
    .filter(filter)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0) || (a.code ?? '').localeCompare(b.code ?? ''));
  const rows = filtered.map((f) => toWhispCsvRow(f, commodities));
  const lines = rows.map((row) => row.join(','));
  return [WHISP_CSV_HEADER, ...lines].join('\n');
}
