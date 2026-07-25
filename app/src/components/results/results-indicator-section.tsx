"use client";

import { cn } from "@/lib/utils";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { riskDotClass, riskTextClass } from "./risk-badge";
import type { RiskTone } from "@/lib/results/catalog-fields";

export type IndicatorItem = {
  key: string;
  label: string;
  yesTone: RiskTone | null;
  yes: number;
  pct: number;
  plotYes: boolean | null;
};

interface IndicatorSectionProps {
  title: string;
  items: IndicatorItem[];
  plotMode: boolean;
  total: number;
  indicatorFilter?: string | null;
  onIndicatorFilter?: (field: string | null) => void;
}

export function IndicatorSection({
  title,
  items,
  plotMode,
  total,
  indicatorFilter,
  onIndicatorFilter,
}: IndicatorSectionProps) {
  return (
    <section>
      <h2 className="mb-2 text-[10px] font-semibold uppercase tracking-[0.08em] text-text-muted">
        {title}
      </h2>
      <div className="grid grid-cols-1 gap-x-3 gap-y-1 min-[560px]:grid-cols-3">
        {items.map((i) => {
          const selected = !plotMode && indicatorFilter === i.key;
          const canFilter = !plotMode && i.yes > 0 && Boolean(onIndicatorFilter);
          const emphasized = plotMode ? i.plotYes : i.yes > 0;

          return (
            <Tooltip key={i.key}>
              <TooltipTrigger
                type="button"
                disabled={!canFilter}
                onClick={() =>
                  onIndicatorFilter?.(indicatorFilter === i.key ? null : i.key)
                }
                className={cn(
                  "group min-w-0 rounded-sm px-2 py-1.5 text-left transition-colors",
                  canFilter && "cursor-pointer hover:bg-surface-raised",
                  selected
                    ? "bg-accent-green/[0.06]"
                    : canFilter
                      ? ""
                      : "cursor-default"
                )}
              >
                <div className="mb-1 flex items-baseline justify-between gap-2">
                  <span
                    className={cn(
                      "min-w-0 truncate text-xs",
                      selected || emphasized
                        ? "font-medium text-text-primary"
                        : "text-text-muted"
                    )}
                  >
                    {i.label}
                  </span>
                  {plotMode ? (
                    <span className="flex shrink-0 items-center gap-1.5 text-xs font-semibold uppercase tracking-wide">
                      <span
                        className={cn(
                          "size-[6px] shrink-0 rounded-full",
                          i.plotYes && i.yesTone ? riskDotClass[i.yesTone] : "bg-text-muted"
                        )}
                      />
                      <span
                        className={
                          i.plotYes && i.yesTone ? riskTextClass[i.yesTone] : "text-text-muted"
                        }
                      >
                        {i.plotYes ? "yes" : "no"}
                      </span>
                    </span>
                  ) : (
                    <span className="shrink-0 text-xs tabular-nums text-text-primary">
                      {i.yes}
                      <span className="text-text-muted">/{total}</span>
                    </span>
                  )}
                </div>
                <div className="h-1 overflow-hidden rounded-full bg-surface-raised">
                  <div
                    className={cn(
                      "h-full rounded-full transition-[filter]",
                      plotMode
                        ? i.plotYes && i.yesTone
                          ? riskDotClass[i.yesTone]
                          : "bg-transparent"
                        : i.yesTone
                          ? riskDotClass[i.yesTone]
                          : "bg-text-muted",
                      !plotMode && canFilter && "group-hover:brightness-125 group-hover:saturate-150",
                      !plotMode && selected && "brightness-125 saturate-150"
                    )}
                    style={{ width: plotMode ? (i.plotYes ? "100%" : "0%") : `${i.pct}%` }}
                  />
                </div>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                {plotMode
                  ? `${i.label}: ${i.plotYes ? "yes" : "no"}`
                  : `${i.label}: ${i.yes} of ${total} plots marked yes`
                }
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>
    </section>
  );
}
