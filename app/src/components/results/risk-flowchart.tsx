import type { ReactNode } from "react";
import { useTranslations } from "next-intl";
import { Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { riskValueToTone, type RiskTone, type RiskValue } from "@/lib/results/catalog-fields";
import { questionLabel, type TreeStepView } from "@/lib/results/risk-trees";
import { riskBorderClass, riskLevelStyles, riskTextClass } from "./risk-badge";

function Outcome({ tone, label, active }: { tone: RiskTone; label: string; active?: boolean }) {
  return (
    <span
      className={cn(
        "font-semibold",
        riskTextClass[tone],
        active && "underline decoration-accent-green underline-offset-2"
      )}
    >
      {label}
    </span>
  );
}

function Step({ step, showCounts }: { step: TreeStepView; showCounts: boolean }) {
  const t = useTranslations("Results");
  const matchOn = step.selected === "match";
  const restOn = step.selected === "rest";
  const end = matchOn ? step.then : restOn ? step.otherwise : null;
  const stopTone = typeof end === "string" && end !== "continue" ? riskValueToTone(end) : null;

  const outcome = (value: RiskValue, active: boolean) => {
    const tone = riskValueToTone(value)!;
    return <Outcome tone={tone} label={t(`riskToneShort.${tone}`)} active={active} />;
  };
  const branch = (side: "yes" | "no", arrow: string, count: number, result?: ReactNode) => (
    <>
      <span className="uppercase tracking-wide opacity-70">{t(side)}</span>
      <span className="text-text-dim">{arrow}</span>
      {result}
      {showCounts && (
        <span className="tabular-nums text-text-muted">({t('plotCount', { count })})</span>
      )}
    </>
  );

  return (
    <div>
      <div className={cn("flex items-center gap-3", step.disabled && "pointer-events-none opacity-35")}>
        <div
          className={cn(
            "group min-w-0 flex-1 rounded-sm border px-3 py-2 text-left text-xs font-medium",
            stopTone
              ? cn(riskLevelStyles[stopTone], riskBorderClass[stopTone])
              : step.selected
                ? "border-accent-green bg-accent-green/[0.06] text-text-primary"
                : "border-border bg-surface text-text-primary"
          )}
        >
          {questionLabel(step.columns, t)}
          <Tooltip>
            <TooltipTrigger className="ml-1 inline-block shrink-0 align-middle opacity-0 transition-opacity group-hover:opacity-100">
              <Info className="size-3 text-text-dim hover:text-text-muted" />
            </TooltipTrigger>
            <TooltipContent side="bottom" align="start">
              {t('reachedStep', { count: step.matchCount + step.restCount })}
            </TooltipContent>
          </Tooltip>
        </div>
        {typeof step.then === "string" && (
          <div
            className={cn(
              "flex shrink-0 items-center gap-1.5 text-[11px]",
              matchOn ? "text-text-primary" : "text-text-muted",
              restOn && "opacity-35"
            )}
          >
            {branch(step.is, "→", step.matchCount, outcome(step.then, matchOn))}
          </div>
        )}
      </div>
      {typeof step.then !== "string" && (
        <div className={cn("ml-3 border-l border-dashed pl-3", matchOn ? "border-accent-green" : "border-border")}>
          <div
            className={cn(
              "flex items-center gap-1.5 py-1.5 text-[11px]",
              matchOn ? "text-text-primary" : "text-text-muted",
              (step.disabled || restOn) && "opacity-35"
            )}
          >
            {branch(step.is, "↓", step.matchCount)}
          </div>
          <StepList steps={step.then} showCounts={showCounts} />
        </div>
      )}
      <div
        className={cn(
          "flex items-center gap-1.5 py-1.5 pl-3 text-[11px]",
          (step.disabled || matchOn) && "opacity-35"
        )}
      >
        <div
          className={cn(
            "h-4 w-px border-l border-dashed",
            restOn ? (stopTone ? riskBorderClass[stopTone] : "border-accent-green") : "border-border"
          )}
        />
        <span className={cn("inline-flex items-center gap-1.5", restOn ? "text-text-primary" : "text-text-muted")}>
          {branch(
            step.is === "yes" ? "no" : "yes",
            "↓",
            step.restCount,
            step.otherwise === "continue" ? <span>{t("continue")}</span> : outcome(step.otherwise, restOn)
          )}
        </span>
      </div>
    </div>
  );
}

function StepList({ steps, showCounts }: { steps: TreeStepView[]; showCounts: boolean }) {
  return (
    <div className="flex flex-col">
      {steps.map((step, i) => (
        <Step key={i} step={step} showCounts={showCounts} />
      ))}
    </div>
  );
}

export function RiskFlowchart({
  steps,
  showCounts,
}: {
  steps: TreeStepView[];
  showCounts: boolean;
}) {
  const t = useTranslations("Results");
  if (!steps.length) {
    return <p className="text-sm text-text-muted">{t('noRiskPath')}</p>;
  }
  return <StepList steps={steps} showCounts={showCounts} />;
}
