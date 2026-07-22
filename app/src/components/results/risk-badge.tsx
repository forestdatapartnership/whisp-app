import { cn } from "@/lib/utils";
import { riskValueToTone, type RiskTone } from "@/lib/results/catalog-fields";

export type RiskLevel = "low" | "medium" | "high" | "info";

interface RiskBadgeProps {
  level: RiskLevel;
  label: string;
  className?: string;
}

export const riskLevelStyles: Record<RiskLevel, string> = {
  high: "bg-risk-high/12 text-risk-high",
  medium: "bg-risk-medium/12 text-risk-medium",
  low: "bg-risk-low/12 text-risk-low",
  info: "bg-surface-raised text-text-muted",
};

export const riskDotClass: Record<RiskLevel, string> = {
  high: "bg-risk-high",
  medium: "bg-risk-medium",
  low: "bg-risk-low",
  info: "bg-text-muted",
};

export const riskTextClass: Record<RiskTone, string> = {
  low: "text-risk-low",
  medium: "text-risk-medium",
  high: "text-risk-high",
};

export const riskBorderClass: Record<RiskTone, string> = {
  low: "border-risk-low",
  medium: "border-risk-medium",
  high: "border-risk-high",
};

const SHORT_LABEL: Record<RiskTone, string> = {
  low: "Low",
  high: "High",
  medium: "More info needed",
};

export function riskFromValue(value: unknown): { level: RiskLevel; label: string } {
  const tone = riskValueToTone(String(value ?? ""));
  if (!tone) return { level: "info", label: String(value ?? "") };
  return { level: tone, label: SHORT_LABEL[tone] };
}

export function RiskBadge({ level, label, className }: RiskBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-[7px] py-[2px] text-[10px] font-medium whitespace-nowrap",
        riskLevelStyles[level],
        className
      )}
    >
      <span className={cn("h-[5px] w-[5px] shrink-0 rounded-full", riskDotClass[level])} />
      {label}
    </span>
  );
}
