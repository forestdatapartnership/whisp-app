import { cn } from "@/lib/utils";

interface RiskBadgeProps {
  level: "low" | "medium" | "high" | "info";
  label: string;
  className?: string;
}

const levelStyles = {
  high: "bg-[rgba(224,90,90,0.12)] text-[#e05a5a]",
  medium: "bg-[rgba(224,154,26,0.12)] text-[#e09a1a]",
  low: "bg-[rgba(76,126,11,0.12)] text-accent-green",
  info: "bg-surface-raised text-text-muted",
};

const dotStyles = {
  high: "bg-[#e05a5a]",
  medium: "bg-[#e09a1a]",
  low: "bg-accent-green",
  info: "bg-text-muted",
};

export function RiskBadge({ level, label, className }: RiskBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-[7px] py-[2px] text-[10px] font-medium whitespace-nowrap",
        levelStyles[level],
        className
      )}
    >
      <span className={cn("h-[5px] w-[5px] shrink-0 rounded-full", dotStyles[level])} />
      {label}
    </span>
  );
}
