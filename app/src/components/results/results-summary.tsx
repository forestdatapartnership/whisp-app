"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { linkVariants } from "@/components/ui/link";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  RiskBadge,
  riskDotClass,
  riskFromValue,
  riskTextClass,
} from "./risk-badge";
import { ResultsFilterChip } from "./results-filter-chip";
import { ResultsOverlayHeader } from "./results-overlay-header";
import { RiskFlowchart } from "./risk-flowchart";
import type { ColumnDef, ResultRow } from "./results-table";
import {
  computeRiskMix,
  countTruthy,
  isTruthyCell,
  riskToneToValue,
  riskValueLabel,
  type RiskFilter,
  type RiskMix,
  type RiskTone,
} from "@/lib/results/catalog-fields";
import {
  COMMODITY_OPTIONS,
  WATERBODY_FIELD,
  WATERBODY_LABEL,
  buildTreeSteps,
  countryRiskBreakdown,
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
  onCountryFilter?: (country: string) => void;
  className?: string;
}

function MixBar({ mix }: { mix: RiskMix }) {
  const total = mix.total || 1;
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

type IndicatorItem = {
  key: string;
  label: string;
  yesTone: RiskTone | null;
  yes: number;
  pct: number;
  plotYes: boolean | null;
};

function IndicatorSection({
  title,
  hint,
  valueLabel,
  items,
  plotMode,
  total,
  indicatorFilter,
  onIndicatorFilter,
}: {
  title: string;
  hint?: string;
  valueLabel: string;
  items: IndicatorItem[];
  plotMode: boolean;
  total: number;
  indicatorFilter?: string | null;
  onIndicatorFilter?: (field: string | null) => void;
}) {
  return (
    <section>
      <div className="mb-2 flex items-end justify-between gap-3">
        <div>
          <h2 className="text-[10px] font-semibold uppercase tracking-[0.08em] text-text-muted">
            {title}
          </h2>
          {hint && <p className="mt-1 text-[11px] text-text-muted">{hint}</p>}
        </div>
        <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-text-muted">
          {valueLabel}
        </span>
      </div>
      <div className="flex flex-col gap-1">
        {items.map((i) => {
          const selected = !plotMode && indicatorFilter === i.key;
          const canFilter = !plotMode && i.yes > 0 && Boolean(onIndicatorFilter);
          const emphasized = plotMode ? i.plotYes : i.yes > 0;

          return (
            <button
              key={i.key}
              type="button"
              disabled={!canFilter}
              onClick={() =>
                onIndicatorFilter?.(indicatorFilter === i.key ? null : i.key)
              }
              className={cn(
                "group w-full rounded-sm px-2 py-2 text-left transition-colors",
                canFilter && "cursor-pointer",
                selected ? "bg-accent-green/[0.06]" : canFilter && "hover:bg-surface-raised"
              )}
            >
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
                      i.plotYes ? "text-text-primary" : "text-text-muted"
                    )}
                  >
                    {i.plotYes ? "yes" : "no"}
                  </span>
                ) : (
                  <span className="text-xs tabular-nums text-text-primary">
                    {i.yes}
                    <span className="text-text-muted">/{total}</span>
                  </span>
                )}
              </div>
              {!plotMode && (
                <div className="h-1 overflow-hidden rounded-full bg-surface-raised">
                  <div
                    className={cn(
                      "h-full rounded-full transition-[filter]",
                      i.yesTone ? riskDotClass[i.yesTone] : "bg-text-muted",
                      canFilter && "group-hover:brightness-125 group-hover:saturate-150",
                      selected && "brightness-125 saturate-150"
                    )}
                    style={{ width: `${i.pct}%` }}
                  />
                </div>
              )}
            </button>
          );
        })}
      </div>
    </section>
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
  onClearFilter,
  onCountryFilter,
  className,
}: ResultsSummaryProps) {
  const plotMode = Boolean(selectedRow);
  const option = getCommodity(commodity);
  const { riskField } = option;
  const filterLabel = formatResultsFilterLabel(riskFilter, indicatorFilter);

  const mix = useMemo(() => computeRiskMix(rows, riskField), [rows, riskField]);
  const countries = useMemo(() => countryRiskBreakdown(rows, riskField), [rows, riskField]);
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
          {RISK_TONES.map((tone) => {
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
                  {riskValueLabel(value)}
                </p>
                <p className={cn("text-xl font-semibold tabular-nums tracking-tight", riskTextClass[tone])}>
                  {n}
                </p>
              </button>
            );
          })}
        </div>
      )}

      <ScrollArea className="min-h-0 flex-1">
        <div className="mx-auto flex w-full max-w-[820px] flex-col gap-8 px-5 py-6">
          <IndicatorSection
            title="Risk indicators"
            hint={
              !plotMode
                ? `Plots with indicator = yes${onIndicatorFilter ? " · click to filter" : ""}`
                : undefined
            }
            valueLabel={plotMode ? "Value" : "Yes"}
            items={riskIndicators}
            plotMode={plotMode}
            total={rows.length}
            indicatorFilter={indicatorFilter}
            onIndicatorFilter={onIndicatorFilter}
          />

          {otherIndicators.length > 0 && (
            <IndicatorSection
              title="Other indicators"
              hint={
                !plotMode
                  ? `Not used in the risk path${onIndicatorFilter ? " · click to filter" : ""}`
                  : undefined
              }
              valueLabel={plotMode ? "Value" : "Yes"}
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

          {!plotMode && countries.length > 1 && (
            <section>
              <div className="mb-3 flex items-end justify-between gap-3">
                <h2 className="text-[10px] font-semibold uppercase tracking-[0.08em] text-text-muted">
                  By country
                </h2>
                {onCountryFilter && (
                  <span className="text-[10px] text-text-muted">Click to filter</span>
                )}
              </div>
              <div className="flex flex-col gap-1">
                {countries.slice(0, 8).map((c) => (
                  <button
                    key={c.country}
                    type="button"
                    disabled={!onCountryFilter}
                    onClick={() => onCountryFilter?.(c.country)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-sm px-2 py-1.5 text-left transition-colors",
                      onCountryFilter && "cursor-pointer hover:bg-surface-raised"
                    )}
                  >
                    <span className="w-16 shrink-0 truncate text-xs text-text-muted">{c.country}</span>
                    <MixBar mix={c} />
                    <span className="w-8 shrink-0 text-right text-xs tabular-nums text-text-primary">
                      {c.total}
                    </span>
                  </button>
                ))}
              </div>
            </section>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
