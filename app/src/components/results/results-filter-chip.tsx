"use client";

import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { controlRounded } from "@/components/ui/styles";

export function ResultsFilterChip({
  label,
  onClear,
}: {
  label: string;
  onClear: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClear}
      className={cn(
        "inline-flex h-[30px] cursor-pointer items-center gap-1.5 border border-border bg-accent-green/[0.08] px-2.5 text-[11px] font-medium text-accent-green",
        controlRounded
      )}
    >
      {label}
      <X className="size-3" />
    </button>
  );
}
