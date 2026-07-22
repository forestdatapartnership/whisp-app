"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ListFilter } from "lucide-react";
import { ResultsFilterChip } from "./results-filter-chip";
import { ResultsSearchInput } from "./results-search-input";

interface ResultsSearchBarProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  fieldPickerOpen?: boolean;
  onOpenFieldPicker: () => void;
  filterLabel?: string | null;
  onClearFilter?: () => void;
  className?: string;
}

export function ResultsSearchBar({
  searchValue,
  onSearchChange,
  fieldPickerOpen,
  onOpenFieldPicker,
  filterLabel,
  onClearFilter,
  className,
}: ResultsSearchBarProps) {
  return (
    <div
      className={cn(
        "flex shrink-0 flex-wrap items-center gap-2 border-b border-border bg-surface px-[14px] py-2",
        className
      )}
    >
      <ResultsSearchInput
        value={searchValue}
        onChange={onSearchChange}
        placeholder="Search plot ID, external ID, country…"
      />
      {filterLabel && onClearFilter && (
        <ResultsFilterChip label={filterLabel} onClear={onClearFilter} />
      )}
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
    </div>
  );
}
