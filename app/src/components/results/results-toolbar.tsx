"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ArrowLeft, ChartColumn, ChevronDown, Download, FileText, Map, Table2 } from "lucide-react";

interface ResultsToolbarProps {
  title?: string;
  plotCount?: number;
  mapVisible?: boolean;
  onToggleMap?: (visible: boolean) => void;
  summaryOpen?: boolean;
  onOpenSummary?: () => void;
  onCloseSummary?: () => void;
  onBack?: () => void;
  onExportCsv?: () => void;
  onExportGeoJson?: () => void;
  onExportHtml?: () => void;
  onOpenWhispMap?: () => void;
  whispMapDisabled?: boolean;
  className?: string;
}

export function ResultsToolbar({
  title = "Results",
  plotCount = 0,
  mapVisible = false,
  onToggleMap,
  summaryOpen = false,
  onOpenSummary,
  onCloseSummary,
  onBack,
  onExportCsv,
  onExportGeoJson,
  onExportHtml,
  onOpenWhispMap,
  whispMapDisabled = false,
  className,
}: ResultsToolbarProps) {
  const [exportOpen, setExportOpen] = useState(false);

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
      {onOpenSummary && onCloseSummary && (
        <>
          <Button
            size="sm"
            variant={!summaryOpen ? "secondary" : "outline"}
            onClick={onCloseSummary}
          >
            <Table2 />
            Table
          </Button>
          <Button
            size="sm"
            variant={summaryOpen ? "secondary" : "outline"}
            onClick={onOpenSummary}
          >
            <ChartColumn />
            Risk overview
          </Button>
        </>
      )}
      <div className="flex-1" />
      <Button variant="outline" size="sm" onClick={onBack}>
        <ArrowLeft />
        New analysis
      </Button>
      <DropdownMenu open={exportOpen} onOpenChange={setExportOpen}>
        <DropdownMenuTrigger render={<Button variant="secondary" size="sm" className="min-w-[90px]" />}>
          <Download />
          Download
          <ChevronDown />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-[160px] border-border bg-surface">
          <DropdownMenuItem
            onClick={() => {
              onExportCsv?.();
              setExportOpen(false);
            }}
            className="cursor-pointer gap-2 text-xs text-text-muted focus:bg-surface-raised focus:text-text-primary"
          >
            <FileText className="h-3 w-3" />
            CSV
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => {
              onExportGeoJson?.();
              setExportOpen(false);
            }}
            className="cursor-pointer gap-2 text-xs text-text-muted focus:bg-surface-raised focus:text-text-primary"
          >
            <FileText className="h-3 w-3" />
            GeoJSON
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => {
              onExportHtml?.();
              setExportOpen(false);
            }}
            className="cursor-pointer gap-2 text-xs text-text-muted focus:bg-surface-raised focus:text-text-primary"
          >
            <FileText className="h-3 w-3" />
            HTML Report
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <Button
        variant="default"
        size="sm"
        onClick={onOpenWhispMap}
        disabled={whispMapDisabled}
      >
        <Map />
        Open in Whisp Map
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
