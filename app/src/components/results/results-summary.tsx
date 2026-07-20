"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { linkVariants } from "@/components/ui/link";
import { ScrollArea } from "@/components/ui/scroll-area";
import { RiskBadge, riskDotClass, riskFromValue } from "./risk-badge";
import { ResultsFilterChip } from "./results-filter-chip";
import { ResultsOverlayHeader } from "./results-overlay-header";
import { RiskFlowchart } from "./risk-flowchart";
import type { ColumnDef, ResultRow } from "./results-table";
import {
  computeRiskMix,
  countTruthy,
  isTruthyCell,
  riskToneToValue,
  type RiskFilter,
  type RiskTone,
} from "@/lib/results/catalog-fields";
import {
  COMMODITY_OPTIONS,
  buildTreeSteps,
  countryRiskBreakdown,
  type CommodityKey,
} from "@/lib/results/risk-trees";

const linkBtn = cn("cursor-pointer bg-transparent p-0 text-xs transition-colors", linkVariants.accent);

export interface ResultsSummaryProps {
  open: boolean;
  rows: ResultRow[];
  filteredCount: number;
  columns: ColumnDef[];
  commodity: CommodityKey;
  onCommodityChange: (key: CommodityKey) => void;
  selectedRow?: ResultRow | null;
  onClearSelection?: () => void;
  riskFilter?: RiskFilter | null;
  onRiskFilter?: (filter: RiskFilter | null) => void;
  indicatorFilter?: string | null;
  onIndicatorFilter?: (field: string | null) => void;
  filterLabel?: string | null;
  onClearFilter?: () => void;
  className?: string;
}

const RISK_ROWS: Array<{ label: string; tone: RiskTone }> = [
  { label: "Low risk", tone: "low" },
  { label: "More info needed", tone: "medium" },
  { label: "High risk", tone: "high" },
];

const RISK_TEXT: Record<RiskTone, string> = {
  low: "text-risk-low",
  medium: "text-risk-medium",
  high: "text-risk-high",
};

function MixBar({ mix }: { mix: { low: number; medium: number; high: number; count: number } }) {
  const total = mix.count || 1;
  return (
    <div className="flex h-1 min-w-0 flex-1 overflow-hidden rounded-full bg-surface-raised">
      {(
        [
          [mix.low, "low"],
          [mix.medium, "medium"],
          [mix.high, "high"],
        ] as const
      )
        .filter(([n]) => n > 0)
        .map(([n, tone]) => (
          <div
            key={tone}
            className={cn("h-full", riskDotClass[tone])}
            style={{ width: `${(n / total) * 100}%` }}
          />
        ))}
    </div>
  );
}

export function ResultsSummary({
  open,
  rows,
  filteredCount,
  columns,
  commodity,
  onCommodityChange,
  selectedRow,
  onClearSelection,
  riskFilter,
  onRiskFilter,
  indicatorFilter,
  onIndicatorFilter,
  filterLabel,
  onClearFilter,
  className,
}: ResultsSummaryProps) {
  const plotMode = Boolean(selectedRow);
  const option = COMMODITY_OPTIONS.find((o) => o.key === commodity)!;
  const { riskField } = option;

  const mix = useMemo(() => computeRiskMix(rows, riskField), [rows, riskField]);
  const countries = useMemo(() => countryRiskBreakdown(rows, riskField), [rows, riskField]);
  const treeSteps = useMemo(
    () => buildTreeSteps(commodity, rows, selectedRow ?? null),
    [commodity, rows, selectedRow]
  );
  const indicators = useMemo(() => {
    const present = new Set(columns.map((c) => c.key));
    const scope = selectedRow ? [selectedRow] : rows;
    return option.indicators
      .filter((ind) => present.has(ind.key))
      .map((ind) => {
        const yes = countTruthy(scope, ind.key);
        return {
          key: ind.key,
          label: ind.label,
          yesTone: ind.yesTone,
          yes,
          pct: Math.round((yes / (scope.length || 1)) * 100),
          plotYes: selectedRow ? isTruthyCell(selectedRow[ind.key]) : null,
        };
      });
  }, [columns, option.indicators, rows, selectedRow]);

  const selectedBadge = selectedRow ? riskFromValue(selectedRow[riskField]) : null;

  if (!open) return null;

  return (
    <div className={cn("absolute inset-0 z-50 flex flex-col overflow-hidden bg-bg", className)}>
      <ResultsOverlayHeader
        meta={
          <div className="flex items-center gap-2">
            {plotMode ? (
              <>
                <span>Plot {String(selectedRow?.plotId ?? "—")}</span>
                {selectedBadge && selectedBadge.level !== "info" && (
                  <RiskBadge level={selectedBadge.level} label={selectedBadge.label} />
                )}
                <button type="button" onClick={onClearSelection} className={cn(linkBtn, "ml-2")}>
                  Clear selection
                </button>
              </>
            ) : (
              <span>
                {filteredCount} plot{filteredCount !== 1 ? "s" : ""}
              </span>
            )}
          </div>
        }
        leading={
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <div className="flex overflow-hidden rounded-sm bg-border gap-px">
              {COMMODITY_OPTIONS.map((o) => (
                <button
                  key={o.key}
                  type="button"
                  onClick={() => onCommodityChange(o.key)}
                  className={cn(
                    "cursor-pointer bg-surface px-3 py-1.5 text-xs whitespace-nowrap transition-colors",
                    commodity === o.key
                      ? "bg-surface-raised font-medium text-text-primary"
                      : "text-text-muted hover:bg-surface-raised hover:text-text-primary"
                  )}
                >
                  {o.label}
                </button>
              ))}
            </div>
            {filterLabel && onClearFilter && (
              <ResultsFilterChip label={filterLabel} onClear={onClearFilter} />
            )}
          </div>
        }
      />

      {!plotMode && (
        <div className="grid shrink-0 grid-cols-3 border-b border-border bg-surface">
          {RISK_ROWS.map((r) => {
            const value = riskToneToValue(r.tone);
            const active = riskFilter?.field === riskField && riskFilter.value === value;
            return (
              <button
                key={r.tone}
                type="button"
                onClick={() =>
                  onRiskFilter?.(
                    active ? null : { field: riskField, value }
                  )
                }
                className={cn(
                  "cursor-pointer border-r border-border px-[18px] py-3.5 text-left last:border-r-0 transition-colors",
                  active ? "bg-accent-green/[0.08]" : "hover:bg-surface-raised"
                )}
              >
                <p className="mb-1 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-text-muted">
                  <span className={cn("size-[6px] rounded-full", riskDotClass[r.tone])} />
                  {r.label}
                </p>
                <p className={cn("text-xl font-semibold tabular-nums tracking-tight", RISK_TEXT[r.tone])}>
                  {mix[r.tone]}
                </p>
              </button>
            );
          })}
        </div>
      )}

      <ScrollArea className="min-h-0 flex-1">
        <div className="mx-auto flex w-full max-w-[820px] flex-col gap-8 px-5 py-6">
          <section>
            <div className="mb-2 flex items-end justify-between gap-3">
              <h2 className="text-[10px] font-semibold uppercase tracking-[0.08em] text-text-muted">
                Indicators
              </h2>
              <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-text-muted">
                {plotMode ? "Value" : "Yes"}
              </span>
            </div>
            <div className="flex flex-col gap-1">
              {indicators.map((i) => {
                const barTone = i.yesTone;
                const selected = !plotMode && indicatorFilter === i.key;
                const canFilter = !plotMode && i.yes > 0 && Boolean(onIndicatorFilter);
                const emphasized = plotMode ? i.plotYes : i.yes > 0;

                const body = (
                  <>
                    <div className="mb-1 flex items-baseline justify-between gap-3">
                      <span
                        className={cn(
                          "text-xs",
                          selected || emphasized
                            ? "font-medium text-text-primary"
                            : "text-text-muted"
                        )}
                      >
                        {i.label}
                      </span>
                      {plotMode ? (
                        <span
                          className={cn(
                            "text-xs font-semibold uppercase tracking-wide",
                            i.plotYes
                              ? barTone
                                ? RISK_TEXT[barTone]
                                : "text-text-primary"
                              : "text-text-muted"
                          )}
                        >
                          {i.plotYes ? "yes" : "no"}
                        </span>
                      ) : (
                        <span className="text-xs tabular-nums text-text-primary">
                          {i.yes}
                          <span className="text-text-muted">/{rows.length}</span>
                        </span>
                      )}
                    </div>
                    {!plotMode && (
                      <div className="h-1 overflow-hidden rounded-full bg-surface-raised">
                        <div
                          className={cn(
                            "h-full rounded-full transition-[filter]",
                            barTone ? riskDotClass[barTone] : "bg-text-muted",
                            canFilter && "group-hover:brightness-125 group-hover:saturate-150",
                            selected && "brightness-125 saturate-150"
                          )}
                          style={{ width: `${i.pct}%` }}
                        />
                      </div>
                    )}
                  </>
                );

                if (!canFilter) {
                  return (
                    <div key={i.key} className="rounded-sm px-2 py-2">
                      {body}
                    </div>
                  );
                }

                return (
                  <button
                    key={i.key}
                    type="button"
                    onClick={() =>
                      onIndicatorFilter?.(indicatorFilter === i.key ? null : i.key)
                    }
                    className={cn(
                      "group w-full cursor-pointer rounded-sm px-2 py-2 text-left transition-colors",
                      selected ? "bg-accent-green/[0.08]" : "hover:bg-surface-raised"
                    )}
                  >
                    {body}
                  </button>
                );
              })}
            </div>
          </section>

          <section>
            <h2 className="mb-3 text-[10px] font-semibold uppercase tracking-[0.08em] text-text-muted">
              Risk path
            </h2>
            <RiskFlowchart steps={treeSteps} showCounts={!plotMode} />
          </section>

          {!plotMode && countries.length > 1 && (
            <section>
              <h2 className="mb-3 text-[10px] font-semibold uppercase tracking-[0.08em] text-text-muted">
                By country
              </h2>
              <div className="flex flex-col gap-3">
                {countries.slice(0, 8).map((c) => (
                  <div key={c.country} className="flex items-center gap-3">
                    <span className="w-16 shrink-0 truncate text-xs text-text-muted">{c.country}</span>
                    <MixBar mix={c} />
                    <span className="w-8 shrink-0 text-right text-xs tabular-nums text-text-primary">
                      {c.count}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
