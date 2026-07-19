import { cn } from "@/lib/utils";
import {
  stepBranches,
  type TreeOutcome,
  type TreeStepView,
} from "@/lib/results/risk-trees";

const OUTCOME_LABEL: Record<Exclude<TreeOutcome, "continue">, string> = {
  low: "Low",
  high: "High",
  more_info_needed: "More info",
};

const OUTCOME_CLASS: Record<Exclude<TreeOutcome, "continue">, string> = {
  low: "text-risk-low",
  high: "text-risk-high",
  more_info_needed: "text-risk-medium",
};

function Outcome({
  outcome,
  active,
}: {
  outcome: Exclude<TreeOutcome, "continue">;
  active?: boolean;
}) {
  return (
    <span
      className={cn(
        "font-semibold",
        OUTCOME_CLASS[outcome],
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

  return (
    <div className={cn(step.disabled && "pointer-events-none opacity-35")}>
      <div className="flex items-center gap-3">
        <div
          className={cn(
            "min-w-0 flex-1 rounded-sm border px-3 py-2 text-xs font-medium text-text-primary",
            active ? "border-accent-green bg-accent-green/[0.06]" : "border-border bg-surface"
          )}
        >
          {step.question}
        </div>
        {right.outcome !== "continue" && (
          <div
            className={cn(
              "flex shrink-0 items-center gap-1.5 text-[11px]",
              right.selected && !step.disabled ? "text-text-primary" : "text-text-muted"
            )}
          >
            <span className="uppercase tracking-wide opacity-70">{right.side}</span>
            <span className="text-text-dim">→</span>
            <Outcome outcome={right.outcome} active={right.selected && !step.disabled} />
            {showCounts && <span className="tabular-nums text-text-muted">{right.count}</span>}
          </div>
        )}
      </div>
      {(!isLast || down.outcome !== "continue") && (
        <div className="flex items-center gap-1.5 py-1.5 pl-3 text-[11px]">
          <div
            className={cn(
              "h-4 w-px border-l border-dashed",
              down.selected && !step.disabled ? "border-accent-green" : "border-border"
            )}
          />
          <span
            className={cn(
              "inline-flex items-center gap-1.5",
              down.selected && !step.disabled ? "text-text-primary" : "text-text-muted"
            )}
          >
            <span className="uppercase tracking-wide opacity-70">{down.side}</span>
            <span className="text-text-dim">↓</span>
            {down.outcome === "continue" ? (
              <span>continue</span>
            ) : (
              <Outcome outcome={down.outcome} active={down.selected && !step.disabled} />
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
