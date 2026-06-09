"use client";

import { useEffect, useMemo, useState } from "react";
import { Button, CloseButton } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { controlRounded } from "@/components/ui/styles";
import type { CommodityMetadataMap } from "@/types/models";

export interface ColumnGroup {
  name: string;
  columns: string[];
}

export interface FieldPickerColumn {
  key: string;
  header: string;
  type?: string;
  category?: string;
  commodityMetadata?: CommodityMetadataMap;
}

const RISK_CATEGORIES = new Set([
  "Context and metadata",
  "Analysis results",
  "Plot location",
]);

function isRiskColumn(col: FieldPickerColumn): boolean {
  const categoryMatch = col.category != null && RISK_CATEGORIES.has(col.category);
  const usedForRisk = Object.values(col.commodityMetadata ?? {}).some(
    (m) => m?.usedForRisk === true
  );
  return categoryMatch || usedForRisk;
}

function matchesQuery(col: FieldPickerColumn, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const haystack = [
    col.header,
    col.key,
    col.type,
    col.category,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return haystack.includes(q);
}

interface FieldPickerProps {
  open: boolean;
  columns: FieldPickerColumn[];
  groups: ColumnGroup[];
  visible: string[];
  defaultVisible: string[];
  onChange: (visible: string[]) => void;
  onClose: () => void;
}

export function FieldPicker({
  open,
  columns,
  groups,
  visible,
  defaultVisible,
  onChange,
  onClose,
}: FieldPickerProps) {
  const [query, setQuery] = useState("");
  const [activeGroup, setActiveGroup] = useState("");

  const grouped = useMemo(() => {
    const keys = new Set(columns.map((c) => c.key));
    const remaining = new Set(keys);
    const result: ColumnGroup[] = [];
    for (const g of groups) {
      const cols = g.columns.filter((c) => remaining.has(c));
      if (cols.length) {
        result.push({ name: g.name, columns: cols });
        for (const c of cols) remaining.delete(c);
      }
    }
    if (remaining.size) {
      result.push({ name: "Other", columns: Array.from(remaining) });
    }
    return result;
  }, [columns, groups]);

  const columnMap = useMemo(
    () => new Map(columns.map((c) => [c.key, c])),
    [columns]
  );

  const filteredGrouped = useMemo(() => {
    if (!query.trim()) return grouped;
    return grouped
      .map((g) => ({
        name: g.name,
        columns: g.columns.filter((key) => {
          const col = columnMap.get(key);
          return col && matchesQuery(col, query);
        }),
      }))
      .filter((g) => g.columns.length > 0);
  }, [grouped, columnMap, query]);

  useEffect(() => {
    if (!filteredGrouped.length) {
      setActiveGroup("");
      return;
    }
    if (!filteredGrouped.some((g) => g.name === activeGroup)) {
      setActiveGroup(filteredGrouped[0].name);
    }
  }, [filteredGrouped, activeGroup]);

  useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  const activeCols = useMemo(
    () => filteredGrouped.find((g) => g.name === activeGroup)?.columns ?? [],
    [filteredGrouped, activeGroup]
  );

  const selectedInGroup = (groupCols: string[]) =>
    groupCols.filter((c) => visible.includes(c)).length;

  const toggle = (key: string, checked: boolean) => {
    onChange(
      checked ? [...visible, key] : visible.filter((k) => k !== key)
    );
  };

  const reset = () => onChange([...defaultVisible]);

  const selectAll = () => onChange(columns.map((c) => c.key));
  const selectNone = () => onChange([]);
  const selectRiskOnly = () =>
    onChange(columns.filter(isRiskColumn).map((c) => c.key));

  const handleClose = () => {
    setQuery("");
    onClose();
  };

  if (!open) return null;

  return (
    <div className="absolute inset-0 z-20 flex flex-col overflow-hidden bg-bg">
      <div
        role="search"
        className="flex shrink-0 items-center gap-2 border-b border-border bg-surface px-[14px] py-2"
      >
        <div className="relative shrink-0">
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
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search fields…"
            aria-label="Search fields"
            className={`h-[30px] w-[180px] ${controlRounded} border border-border bg-bg pl-[30px] pr-[10px] text-xs text-text-primary outline-none transition-colors placeholder:text-text-muted/60 focus:border-accent-green`}
          />
        </div>
        <div className="flex-1" />
        <span className="shrink-0 text-xs leading-none text-text-muted">
          {visible.length} selected
        </span>
        <div className="flex-1" />
        <CloseButton type="button" onClick={handleClose} />
      </div>
      <div className="flex min-h-0 flex-1 overflow-hidden">
        <ScrollArea className="h-full min-h-0 w-[240px] shrink-0 border-r border-border">
          <div className="py-2">
            {filteredGrouped.map((g) => (
              <button
                key={g.name}
                type="button"
                onClick={() => setActiveGroup(g.name)}
                className={cn(
                  "flex w-full max-w-full items-start gap-2 px-3.5 py-2 text-left text-xs transition-colors",
                  activeGroup === g.name
                    ? "bg-[rgba(125,192,13,0.06)] text-accent-green"
                    : "text-text-muted hover:bg-surface-raised hover:text-text-primary"
                )}
              >
                <span className="max-w-[calc(100%-1.5rem)] min-w-0 flex-1 break-words leading-snug">
                  {g.name}
                </span>
                <span className="shrink-0 opacity-50">{selectedInGroup(g.columns)}</span>
              </button>
            ))}
          </div>
        </ScrollArea>
        <ScrollArea className="min-h-0 min-w-0 flex-1">
          <div className="flex flex-col gap-0.5 px-3.5 py-2.5">
            {activeCols.length === 0 ? (
              <p className="px-2 py-4 text-xs text-text-muted">
                {query.trim() ? "No fields match your search." : "No fields in this category."}
              </p>
            ) : (
              activeCols.map((key) => {
                const col = columnMap.get(key);
                return (
                  <label
                    key={key}
                    className={`flex cursor-pointer items-center gap-2 ${controlRounded} px-2 py-1.5 transition-colors hover:bg-surface-raised`}
                  >
                    <Checkbox
                      checked={visible.includes(key)}
                      onCheckedChange={(checked) => toggle(key, checked === true)}
                    />
                    <span className="text-xs text-text-primary">
                      {col?.header ?? key.replace(/_/g, " ")}
                    </span>
                    <span className="ml-auto text-[10px] text-text-muted">
                      {col?.type ?? "—"}
                    </span>
                  </label>
                );
              })
            )}
          </div>
        </ScrollArea>
      </div>
      <div className="flex shrink-0 items-center gap-2 border-t border-border bg-surface px-4 py-2.5">
        <Button variant="outline" size="sm" onClick={selectNone}>
          Select None
        </Button>
        <Button variant="outline" size="sm" onClick={selectAll}>
          Select All
        </Button>
        <Button variant="outline" size="sm" onClick={selectRiskOnly}>
          Risk Only
        </Button>
        <div className="flex-1" />
        <Button variant="outline" size="sm" onClick={reset}>
          Reset to defaults
        </Button>
        <Button variant="secondary" size="sm" onClick={handleClose}>
          Apply
        </Button>
      </div>
    </div>
  );
}
