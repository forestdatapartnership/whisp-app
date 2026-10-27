"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

export function StarRating({
  value,
  onChange,
  max = 5,
  className,
}: {
  value: number;
  onChange: (value: number) => void;
  max?: number;
  className?: string;
}) {
  const [hovered, setHovered] = useState(0);
  const shown = hovered || value;

  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <div className="flex items-center" onMouseLeave={() => setHovered(0)}>
        {Array.from({ length: max }, (_, i) => i + 1).map((n) => (
          <button
            key={n}
            type="button"
            aria-label={String(n)}
            aria-pressed={value === n}
            onMouseEnter={() => setHovered(n)}
            onClick={() => {
              setHovered(0);
              onChange(value === n ? 0 : n);
            }}
            className="cursor-pointer rounded-sm p-0.5 outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
          >
            <Star
              className={cn(
                "size-5 transition-colors",
                n <= shown ? "fill-accent-green text-accent-green" : "text-text-muted"
              )}
            />
          </button>
        ))}
      </div>
      <span className="w-8 text-sm tabular-nums text-text-muted">{shown > 0 && `${shown}/${max}`}</span>
    </div>
  );
}
