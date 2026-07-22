"use client";

import { controlRounded } from "@/components/ui/styles";
import { cn } from "@/lib/utils";

export function ResultsSearchInput({
  value,
  onChange,
  placeholder,
  type = "text",
  "aria-label": ariaLabel,
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: "text" | "search";
  "aria-label"?: string;
  className?: string;
}) {
  return (
    <div className={cn("relative shrink-0", className)} role="search">
      <svg
        className="pointer-events-none absolute left-[9px] top-1/2 -translate-y-1/2 text-text-muted"
        width="13"
        height="13"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
      </svg>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={ariaLabel}
        className={`h-[30px] w-[180px] ${controlRounded} border border-border bg-bg pl-[30px] pr-[10px] text-xs text-text-primary outline-none transition-colors placeholder:text-text-muted/60 focus:border-accent-green`}
      />
    </div>
  );
}
