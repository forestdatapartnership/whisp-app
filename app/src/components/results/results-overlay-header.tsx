"use client";

import type { ReactNode } from "react";
import { CloseButton } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ResultsOverlayHeaderProps {
  leading: ReactNode;
  meta?: ReactNode;
  onClose?: () => void;
  className?: string;
}

export function ResultsOverlayHeader({
  leading,
  meta,
  onClose,
  className,
}: ResultsOverlayHeaderProps) {
  return (
    <div
      className={cn(
        "flex shrink-0 items-center gap-3 border-b border-border bg-surface px-[14px] py-2",
        className
      )}
    >
      {leading}
      <div className="flex-1" />
      {meta != null && (
        <div className="min-w-0 text-xs leading-none text-text-muted">{meta}</div>
      )}
      {onClose && <CloseButton type="button" onClick={onClose} />}
    </div>
  );
}
