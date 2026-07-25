"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { linkVariants } from "@/components/ui/link";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  riskDotClass,
  riskFromValue,
  riskTextClass,
} from "./risk-badge";
import { ResultsFilterChip } from "./results-filter-chip";
import { ResultsOverlayHeader } from "./results-overlay-header";
import { RiskFlowchart } from "./risk-flowchart";
import { IndicatorSection } from "./results-indicator-section";
import type { ColumnDef, ResultRow } from "./results-table";
import {
  computeRiskMix,
  countTruthy,
  isTruthyCell,
  RISK_TONE_LABEL,
  riskToneToValue,
  type RiskFilter,
  type RiskTone,
} from "@/lib/results/catalog-fields";
import {
  COMMODITY_OPTIONS,
  WATERBODY_FIELD,
  WATERBODY_LABEL,
  buildTreeSteps,
  formatResultsFilterLabel,
  getCommodity,
  type CommodityKey,
} from "@/lib/results/risk-trees";

const linkBtn = cn("cursor-pointer bg-transparent p-0 text-xs transition-colors", linkVariants.accent);

const RISK_TONES: RiskTone[] = ["low", "medium", "high"];

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
  onClearFilter?: () => void;
  className?: string;
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
  onClearFilter,
  className,
}: ResultsSummaryProps) {
  const plotMode = Boolean(selectedRow);
  const option = getCommodity(commodity);
  const { riskField } = option;
  const filterLabel = formatResultsFilterLabel(riskFilter, indicatorFilter);

  const mix = useMemo(() => computeRiskMix(rows, riskField), [rows, riskField]);
  const treeSteps = useMemo(
    () => buildTreeSteps(commodity, rows, selectedRow ?? null),
    [commodity, rows, selectedRow]
  );
  const { riskIndicators, otherIndicators } = useMemo(() => {
    const present = new Set(columns.map((c) => c.key));
    const scope = selectedRow ? [selectedRow] : rows;
    const toRow = (key: string, label: string, yesTone: RiskTone | null) => {
      const yes = countTruthy(scope, key);
      return {
        key,
        label,
        yesTone,
        yes,
        pct: Math.round((yes / (scope.length || 1)) * 100),
        plotYes: selectedRow ? isTruthyCell(selectedRow[key]) : null,
      };
    };
    return {
      riskIndicators: option.indicators
        .filter((ind) => present.has(ind.key))
        .map((ind) => toRow(ind.key, ind.label, ind.yesTone)),
      otherIndicators: present.has(WATERBODY_FIELD)
        ? [toRow(WATERBODY_FIELD, WATERBODY_LABEL, null)]
        : [],
    };
  }, [columns, option.indicators, rows, selectedRow]);

  const selectedBadge = selectedRow ? riskFromValue(selectedRow[riskField]) : null;

  if (!open) return null;

  return (
    <div className={cn("absolute inset-0 z-50 flex flex-col overflow-hidden bg-bg", className)}>
      <ResultsOverlayHeader
        meta={
          !plotMode ? (
            <span>
              {filteredCount} plot{filteredCount !== 1 ? "s" : ""}
            </span>
          ) : undefined
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
                    "cursor-pointer bg-surface px-3 py-1.5 text-xs whitespace-nowrap transition-colors border-b-2",
                    commodity === o.key
                      ? "border-b-accent-green bg-surface-raised font-medium text-text-primary"
                      : "border-b-transparent text-text-muted hover:bg-surface-raised hover:text-text-primary"
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

      <div className="grid shrink-0 grid-cols-3 border-b border-border bg-surface">
        {plotMode ? (
          <div className="col-span-3 flex items-center justify-between px-[18px] py-3">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-text-primary">
                Plot {String(selectedRow?.plotId ?? "—")}
              </span>
              {selectedBadge && selectedBadge.level !== "info" ? (
                <div className="flex items-center gap-1.5">
                  <span className={cn("size-[7px] rounded-full", riskDotClass[selectedBadge.level as RiskTone])} />
                  <span className={cn("text-sm font-semibold", riskTextClass[selectedBadge.level as RiskTone])}>
                    {selectedBadge.label}
                  </span>
                </div>
              ) : (
                <span className="text-sm text-text-muted">No risk data</span>
              )}
            </div>
            <button type="button" onClick={onClearSelection} className={cn(linkBtn)}>
              Clear selection
            </button>
          </div>
        ) : (
          RISK_TONES.map((tone) => {
            const value = riskToneToValue(tone);
            const active = riskFilter?.field === riskField && riskFilter.value === value;
            const n = mix[tone];
            return (
              <button
                key={tone}
                type="button"
                onClick={() => onRiskFilter?.(active ? null : { field: riskField, value })}
                className={cn(
                  "cursor-pointer border-r border-border px-[18px] py-3.5 text-left last:border-r-0 transition-colors",
                  active ? "bg-accent-green/[0.06]" : "hover:bg-surface-raised"
                )}
              >
                <p className="mb-1 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-text-muted">
                  <span className={cn("size-[6px] rounded-full", riskDotClass[tone])} />
                  {RISK_TONE_LABEL[tone]}
                </p>
                <p className={cn("text-xl font-semibold tabular-nums tracking-tight", riskTextClass[tone])}>
                  {n}
                </p>
              </button>
            );
          })
        )}
      </div>

      <ScrollArea className="min-h-0 flex-1">
        <div className="mx-auto flex w-full max-w-[820px] flex-col gap-8 px-5 py-6">
          <IndicatorSection
            title="Risk indicators"
            items={riskIndicators}
            plotMode={plotMode}
            total={rows.length}
            indicatorFilter={indicatorFilter}
            onIndicatorFilter={onIndicatorFilter}
          />

          {otherIndicators.length > 0 && (
            <IndicatorSection
              title="Other indicators"
              items={otherIndicators}
              plotMode={plotMode}
              total={rows.length}
              indicatorFilter={indicatorFilter}
              onIndicatorFilter={onIndicatorFilter}
            />
          )}

          <section>
            <h2 className="mb-3 text-[10px] font-semibold uppercase tracking-[0.08em] text-text-muted">
              Risk path
            </h2>
            {plotMode && (
              <p className="mb-2 text-xs text-text-muted">
                Path for plot {String(selectedRow?.plotId ?? "—")}
              </p>
            )}
            <RiskFlowchart steps={treeSteps} showCounts={!plotMode} />
          </section>
        </div>
      </ScrollArea>
    </div>
  );
}
