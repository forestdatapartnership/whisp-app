"use client";

import { useMemo } from "react";
import { Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { riskDotClass } from "./risk-badge";
import {
  computeRiskMix,
  RISK_TONE_LABEL,
  riskToneToValue,
  type RiskFilter,
  type RiskTone,
} from "@/lib/results/catalog-fields";
import {
  COMMODITY_OPTIONS,
  type CommodityKey,
} from "@/lib/results/risk-trees";
import type { ResultRow } from "./results-table";

const RISK_TONES: RiskTone[] = ["low", "medium", "high"];

interface ResultsStatsStripProps {
  rows: ResultRow[];
  commodity: CommodityKey;
  riskFilter: RiskFilter | null;
  onRiskFilter: (filter: RiskFilter | null) => void;
  className?: string;
}

export function ResultsStatsStrip({
  rows,
  commodity,
  riskFilter,
  onRiskFilter,
  className,
}: ResultsStatsStripProps) {
  const mixes = useMemo(
    () =>
      COMMODITY_OPTIONS.map((opt) => ({
        ...opt,
        mix: computeRiskMix(rows, opt.riskField),
      })),
    [rows]
  );

  return (
    <div
      className={cn(
        "flex shrink-0 items-center gap-4 border-b border-border bg-surface px-[14px] py-1.5 overflow-x-auto",
        className
      )}
    >
      <Tooltip>
        <TooltipTrigger className="flex shrink-0 cursor-default items-center gap-1 text-[10px] font-semibold uppercase tracking-[0.06em] text-text-muted">
          Risk breakdown
          <Info className="size-3 text-text-dim" />
        </TooltipTrigger>
        <TooltipContent side="bottom" align="start">
          Risk distribution across all commodities.
          Click a count to filter the table.
        </TooltipContent>
      </Tooltip>
      {mixes.map(({ key, shortLabel, riskField, mix }) => (
        <div key={key} className="flex items-center gap-2 shrink-0">
          <span className="text-[10px] font-semibold uppercase tracking-[0.06em] text-text-primary">
            {shortLabel}
          </span>
          <div className="flex items-center gap-1.5">
            {RISK_TONES.map((tone) => {
              const value = riskToneToValue(tone);
              const n = mix[tone];
              const active =
                riskFilter?.field === riskField && riskFilter.value === value;

              return (
                <Tooltip key={tone}>
                  <TooltipTrigger
                    type="button"
                    onClick={() => {
                      if (active) {
                        onRiskFilter(null);
                      } else {
                        onRiskFilter({ field: riskField, value });
                      }
                    }}
                    className={cn(
                      "flex cursor-pointer items-center gap-1 rounded px-1.5 py-0.5 text-[11px] tabular-nums transition-colors",
                      active
                        ? "bg-accent-green/[0.10] font-medium text-text-primary"
                        : "text-text-muted hover:bg-surface-raised hover:text-text-primary"
                    )}
                  >
                    <span
                      className={cn("size-[5px] shrink-0 rounded-full", riskDotClass[tone])}
                    />
                    {n}
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    {shortLabel} · {RISK_TONE_LABEL[tone]}: {n} plot{n !== 1 ? "s" : ""}
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
