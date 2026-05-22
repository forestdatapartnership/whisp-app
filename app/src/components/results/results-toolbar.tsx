"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Map } from "lucide-react";

interface ResultsToolbarProps {
  title?: string;
  plotCount?: number;
  currentPage?: number;
  totalPages?: number;
  mapVisible?: boolean;
  onToggleMap?: (visible: boolean) => void;
  onBack?: () => void;
  onOpenWhispMap?: () => void;
  whispMapDisabled?: boolean;
  className?: string;
}

export function ResultsToolbar({
  title = "Results",
  plotCount = 0,
  currentPage = 1,
  totalPages = 1,
  mapVisible = false,
  onToggleMap,
  onBack,
  onOpenWhispMap,
  whispMapDisabled = false,
  className,
}: ResultsToolbarProps) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-[10px] border-b border-border bg-surface px-5 py-[10px] shrink-0",
        className
      )}
    >
      <span className="text-sm font-semibold text-text-primary">{title}</span>
      <span className="inline-flex items-center gap-1 rounded-full border border-border bg-surface-raised px-[9px] py-[2px] text-[11px] text-accent-green">
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
        {plotCount} plot{plotCount !== 1 ? "s" : ""}
      </span>
      <span className="inline-flex items-center gap-1 rounded-full border border-border bg-surface-raised px-[9px] py-[2px] text-[11px] text-text-muted">
        Page {currentPage} of {totalPages}
      </span>
      <div className="flex-1" />
      <Button variant="outline" size="sm" onClick={onBack}>
        <ArrowLeft />
        New analysis
      </Button>
      <Button
        variant="default"
        size="sm"
        onClick={onOpenWhispMap}
        disabled={whispMapDisabled}
      >
        <Map />
        View in Whisp Map
      </Button>
      <div className="flex items-center gap-[7px] text-xs text-text-muted">
        <Switch
          checked={mapVisible}
          onCheckedChange={onToggleMap}
          size="sm"
        />
        Map
      </div>
    </div>
  );
}
