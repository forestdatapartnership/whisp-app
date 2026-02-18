import type { ResultField } from '@/types/models';

const WHISP_COLUMNS_HEADER =
  'Column name,Type,Unit / Values,Short description,Period,Source,Dashboard,Used for risk pcrop,Data theme pcrop,Used for risk acrop,Data theme acrop,Used for risk timber,Data theme timber,Comments';

const NATIONAL_HEADER =
  'code,Type,Unit / Values,Short description,Period,Source,Dashboard,Used for risk pcrop,Data theme pcrop,Used for risk acrop,Data theme acrop,Used for risk timber,Data theme timber,Comments';

function toCsvValue(v: string | number | boolean | undefined | null): string {
  if (v == null || v === '') return '';
  if (typeof v === 'boolean') return v ? '1' : '0';
  const s = String(v);
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function usedForRiskToStr(val: boolean | undefined | null): string {
  if (val === true) return '1';
  if (val === false) return '0';
  return '';
}

function toWhispColumnsRow(field: ResultField): string[] {
  const dashboard = field.powerBiMetadata?.dashboard ? 'x' : '';
  const pcropUsed = usedForRiskToStr(field.commodityMetadata?.pcrop?.usedForRisk);
  const acropUsed = usedForRiskToStr(field.commodityMetadata?.acrop?.usedForRisk);
  const timberUsed = usedForRiskToStr(field.commodityMetadata?.timber?.usedForRisk);

  return [
    toCsvValue(field.code),
    toCsvValue(field.type),
    toCsvValue(field.unit),
    toCsvValue(field.description),
    toCsvValue(field.period),
    toCsvValue(field.source),
    dashboard,
    pcropUsed,
    toCsvValue(field.commodityMetadata?.pcrop?.dataTheme),
    acropUsed,
    toCsvValue(field.commodityMetadata?.acrop?.dataTheme),
    timberUsed,
    toCsvValue(field.commodityMetadata?.timber?.dataTheme),
    toCsvValue(field.comments),
  ];
}

export function buildWhispColumnsCsv(
  fields: ResultField[],
  filter: (f: ResultField) => boolean,
  useNationalHeader: boolean
): string {
  const filtered = fields
    .filter(filter)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0) || (a.code ?? '').localeCompare(b.code ?? ''));
  const rows = filtered.map(toWhispColumnsRow);
  const lines = rows.map((row) => row.join(','));
  const header = useNationalHeader ? NATIONAL_HEADER : WHISP_COLUMNS_HEADER;
  return [header, ...lines].join('\n');
}
