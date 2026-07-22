import {
  computeRiskMix,
  countTruthy,
} from "./catalog-fields";
import {
  COMMODITY_OPTIONS,
  WATERBODY_FIELD,
  WATERBODY_LABEL,
  buildTreeSteps,
} from "./risk-trees";
import { renderOfflineReportHtml } from "./offline-report-shell";
import { downloadHtml, timestampFilename } from "@/lib/utils/export";

const SUMMARY_KEYS = [
  "plotId",
  "external_id",
  "Country",
  "Admin_Level_1",
  WATERBODY_FIELD,
  "risk_pcrop",
  "risk_acrop",
  "risk_timber",
] as const;

function cellValue(value: unknown): string | number | boolean | null {
  if (value == null) return null;
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return value;
  }
  return String(value);
}

export function downloadOfflineReport(input: {
  rows: Array<Record<string, unknown>>;
  columns: Array<{ key: string; header: string }>;
  title?: string;
  theme: "light" | "dark";
}) {
  const { rows, columns, title = "WHISP risk report", theme } = input;
  const headers = new Map(columns.map((c) => [c.key, c.header]));
  const cols = columns.map((c) => ({ key: c.key, header: c.header }));
  const summaryColumns = SUMMARY_KEYS.filter((key) =>
    rows.some((r) => key in r)
  ).map((key) => ({
    key,
    header: headers.get(key) ?? (key === WATERBODY_FIELD ? WATERBODY_LABEL : key),
  }));

  const report = {
    exportedAt: new Date().toISOString(),
    title,
    plotCount: rows.length,
    columns: cols,
    summaryColumns,
    rows: rows.map((row) => {
      const out: Record<string, string | number | boolean | null> = {};
      for (const col of cols) out[col.key] = cellValue(row[col.key]);
      return out;
    }),
    otherIndicators: rows.some((r) => WATERBODY_FIELD in r)
      ? [
          {
            key: WATERBODY_FIELD,
            label: WATERBODY_LABEL,
            yes: countTruthy(rows, WATERBODY_FIELD),
            total: rows.length,
          },
        ]
      : [],
    commodities: COMMODITY_OPTIONS.map((option) => ({
      key: option.key,
      label: option.label,
      riskField: option.riskField,
      mix: computeRiskMix(rows, option.riskField),
      indicators: option.indicators
        .filter((ind) => rows.some((r) => ind.key in r))
        .map((ind) => ({
          key: ind.key,
          label: ind.label,
          yesTone: ind.yesTone,
          yes: countTruthy(rows, ind.key),
          total: rows.length,
        })),
      tree: buildTreeSteps(option.key, rows, null).map((s) => ({
        question: s.question,
        yesCount: s.yesCount,
        noCount: s.noCount,
        yesOutcome: s.yesOutcome,
        noOutcome: s.noOutcome,
      })),
    })),
  };

  downloadHtml(
    renderOfflineReportHtml(JSON.stringify(report), theme),
    timestampFilename("html", "report")
  );
}
