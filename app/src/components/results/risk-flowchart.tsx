import { useTranslations } from "next-intl";
import { Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { riskValueToTone, type RiskTone } from "@/lib/results/catalog-fields";
import {
  stepBranches,
  type TreeOutcome,
  type TreePred,
  type TreeStepView,
} from "@/lib/results/risk-trees";
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

function Step({
  step,
  showCounts,
  isLast,
}: {
  step: TreeStepView;
  showCounts: boolean;
  isLast: boolean;
}) {
  const { down, right } = stepBranches(step);
  const active = Boolean(step.selectedSide) && !step.disabled;
  const selectedOutcome =
    step.selectedSide === "yes"
      ? step.yesOutcome
      : step.selectedSide === "no"
        ? step.noOutcome
        : null;
  const stopTone = active && selectedOutcome && selectedOutcome !== "continue" ? riskValueToTone(selectedOutcome) : null;
  const rightOn = right.selected && !step.disabled;
  const downOn = down.selected && !step.disabled;
  const rightOff = active && !right.selected;
  const downOff = active && !down.selected;

  const t = useTranslations("Results");
  const totalAtStep = step.yesCount + step.noCount;
  const outcomeLabel = (outcome: TreeOutcome) => {
    const tone = riskValueToTone(outcome)!;
    return { tone, label: t(`riskToneShort.${tone}`) };
  };
  const describe = (pred: TreePred): string => {
    switch (pred.op) {
      case "yn": return t(`indicator.${pred.field}`);
      case "not": return t("predicateNot", { indicator: t(`indicator.${pred.field}`) });
      case "and": return pred.of.map(describe).join(t("predicateAnd"));
      case "or": return pred.of.map(describe).join(t("predicateOr"));
    }
  };

  return (
    <div className={cn(step.disabled && "pointer-events-none opacity-35")}>
      <div className="flex items-center gap-3">
        <div
          className={cn(
            "group min-w-0 flex-1 rounded-sm border px-3 py-2 text-left text-xs font-medium",
            stopTone
              ? cn(riskLevelStyles[stopTone], riskBorderClass[stopTone])
              : active
                ? "border-accent-green bg-accent-green/[0.06] text-text-primary"
                : "border-border bg-surface text-text-primary"
          )}
        >
          {t(`question.${step.question}`)}
          <Tooltip>
            <TooltipTrigger className="ml-1 inline-block shrink-0 align-middle opacity-0 transition-opacity group-hover:opacity-100">
              <Info className="size-3 text-text-dim hover:text-text-muted" />
            </TooltipTrigger>
            <TooltipContent side="bottom" align="start">
              {t('tests', { description: describe(step.predicate) })}
              <br />
              {t('reachedStep', { count: totalAtStep })}
            </TooltipContent>
          </Tooltip>
        </div>
        {right.outcome !== "continue" && (
          <div
            className={cn(
              "flex shrink-0 items-center gap-1.5 text-[11px]",
              rightOn ? "text-text-primary" : "text-text-muted",
              rightOff && "opacity-35"
            )}
          >
            <span className="uppercase tracking-wide opacity-70">{t(right.side)}</span>
            <span className="text-text-dim">→</span>
            <Outcome {...outcomeLabel(right.outcome)} active={rightOn} />
            {showCounts && (
              <span className="tabular-nums text-text-muted">
                ({t('plotCount', { count: right.count })})
              </span>
            )}
          </div>
        )}
      </div>
      {(!isLast || down.outcome !== "continue") && (
        <div className={cn("flex items-center gap-1.5 py-1.5 pl-3 text-[11px]", downOff && "opacity-35")}>
          <div
            className={cn(
              "h-4 w-px border-l border-dashed",
              downOn
                ? stopTone && down.outcome !== "continue"
                  ? riskBorderClass[stopTone]
                  : "border-accent-green"
                : "border-border"
            )}
          />
          <span
            className={cn(
              "inline-flex items-center gap-1.5",
              downOn ? "text-text-primary" : "text-text-muted"
            )}
          >
            <span className="uppercase tracking-wide opacity-70">{t(down.side)}</span>
            <span className="text-text-dim">↓</span>
            {down.outcome === "continue" ? (
              <span>{t("continue")}</span>
            ) : (
              <Outcome {...outcomeLabel(down.outcome)} active={downOn} />
            )}
            {showCounts && (
              <span className="tabular-nums text-text-muted">
                ({t('plotCount', { count: down.count })})
              </span>
            )}
          </span>
        </div>
      )}
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
  return (
    <div className="flex flex-col">
      {steps.map((step, i) => (
        <Step
          key={`${step.question}-${i}`}
          step={step}
          showCounts={showCounts}
          isLast={i === steps.length - 1}
        />
      ))}
    </div>
  );
}
