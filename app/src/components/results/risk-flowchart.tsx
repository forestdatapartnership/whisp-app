import { cn } from "@/lib/utils";
import { riskValueToTone, type RiskTone } from "@/lib/results/catalog-fields";
import {
  stepBranches,
  type TreeOutcome,
  type TreeStepView,
} from "@/lib/results/risk-trees";
import { riskLevelStyles } from "./risk-badge";

const OUTCOME_LABEL: Record<Exclude<TreeOutcome, "continue">, string> = {
  low: "Low",
  high: "High",
  more_info_needed: "More info",
};

const RISK_BORDER: Record<RiskTone, string> = {
  low: "border-risk-low",
  medium: "border-risk-medium",
  high: "border-risk-high",
};

const RISK_TEXT: Record<RiskTone, string> = {
  low: "text-risk-low",
  medium: "text-risk-medium",
  high: "text-risk-high",
};

function outcomeTone(outcome: TreeOutcome): RiskTone | null {
  return outcome === "continue" ? null : riskValueToTone(outcome);
}

function Outcome({
  outcome,
  active,
}: {
  outcome: Exclude<TreeOutcome, "continue">;
  active?: boolean;
}) {
  const tone = riskValueToTone(outcome)!;
  return (
    <span
      className={cn(
        "font-semibold",
        RISK_TEXT[tone],
        active && "underline decoration-accent-green underline-offset-2"
      )}
    >
      {OUTCOME_LABEL[outcome]}
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
  const stopTone = active ? outcomeTone(selectedOutcome ?? "continue") : null;
  const rightOn = right.selected && !step.disabled;
  const downOn = down.selected && !step.disabled;
  const rightOff = active && !right.selected;
  const downOff = active && !down.selected;

  return (
    <div className={cn(step.disabled && "pointer-events-none opacity-35")}>
      <div className="flex items-center gap-3">
        <div
          className={cn(
            "min-w-0 flex-1 rounded-sm border px-3 py-2 text-xs font-medium",
            stopTone
              ? cn(riskLevelStyles[stopTone], RISK_BORDER[stopTone])
              : active
                ? "border-accent-green bg-accent-green/[0.06] text-text-primary"
                : "border-border bg-surface text-text-primary"
          )}
        >
          {step.question}
        </div>
        {right.outcome !== "continue" && (
          <div
            className={cn(
              "flex shrink-0 items-center gap-1.5 text-[11px]",
              rightOn ? "text-text-primary" : "text-text-muted",
              rightOff && "opacity-35"
            )}
          >
            <span className="uppercase tracking-wide opacity-70">{right.side}</span>
            <span className="text-text-dim">→</span>
            <Outcome outcome={right.outcome} active={rightOn} />
            {showCounts && <span className="tabular-nums text-text-muted">{right.count}</span>}
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
                  ? RISK_BORDER[stopTone]
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
            <span className="uppercase tracking-wide opacity-70">{down.side}</span>
            <span className="text-text-dim">↓</span>
            {down.outcome === "continue" ? (
              <span>continue</span>
            ) : (
              <Outcome outcome={down.outcome} active={downOn} />
            )}
            {showCounts && <span className="tabular-nums text-text-muted">{down.count}</span>}
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
  if (!steps.length) {
    return <p className="text-sm text-text-muted">No risk path for this commodity.</p>;
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
