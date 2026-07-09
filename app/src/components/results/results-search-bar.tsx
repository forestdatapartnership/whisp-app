"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { controlRounded } from "@/components/ui/styles";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ListFilter, Download, ChevronDown, FileText } from "lucide-react";

interface ResultsSearchBarProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  fieldPickerOpen?: boolean;
  onOpenFieldPicker: () => void;
  onExportCSV?: () => void;
  onExportGeoJSON?: () => void;
  className?: string;
}

export function ResultsSearchBar({
  searchValue,
  onSearchChange,
  fieldPickerOpen,
  onOpenFieldPicker,
  onExportCSV,
  onExportGeoJSON,
  className,
}: ResultsSearchBarProps) {
  const [open, setOpen] = useState(false);

  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-2 border-b border-border bg-surface px-[14px] py-2 shrink-0",
        className
      )}
    >
      <div className="relative">
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
        >
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          type="text"
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search plot ID, external ID, country…"
          className={`h-[30px] w-[180px] ${controlRounded} border border-border bg-bg pl-[30px] pr-[10px] text-xs text-text-primary outline-none transition-colors placeholder:text-text-muted/60 focus:border-accent-green`}
        />
      </div>
      <div className="flex-1" />
      <Button
        variant="outline"
        size="sm"
        onClick={onOpenFieldPicker}
        aria-pressed={fieldPickerOpen}
      >
        <ListFilter />
        Select fields
      </Button>
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger render={<Button variant="secondary" size="sm" />}>
          <Download />
          Export
          <ChevronDown />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-[140px] bg-surface border-border">
          <DropdownMenuItem
            onClick={() => {
              onExportCSV?.();
              setOpen(false);
            }}
            className="text-xs text-text-muted gap-2 cursor-pointer focus:bg-surface-raised focus:text-text-primary"
          >
            <FileText className="h-3 w-3" />
            CSV
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => {
              onExportGeoJSON?.();
              setOpen(false);
            }}
            className="text-xs text-text-muted gap-2 cursor-pointer focus:bg-surface-raised focus:text-text-primary"
          >
            <FileText className="h-3 w-3" />
            GeoJSON
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
