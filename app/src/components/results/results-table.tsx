"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { RiskBadge, riskFromValue } from "./risk-badge";
import { isTruthyCell, isYesNoCell } from "@/lib/results/catalog-fields";

import type { CommodityMetadataMap } from "@/types/models";

export interface ColumnDef {
  key: string;
  header: string;
  type?: string;
  category?: string;
  description?: string;
  commodityMetadata?: CommodityMetadataMap;
  excludeFromResults?: boolean;
}

export interface ResultRow {
  [key: string]: string | number | boolean | null | undefined | object;
}

interface ResultsTableProps {
  columns: ColumnDef[];
  visibleCols: string[];
  data: ResultRow[];
  presenceRows?: ResultRow[];
  selectedRowId?: string | null;
  onSelectRow?: (row: ResultRow | null) => void;
  sortColumn?: string | null;
  sortAsc?: boolean;
  onSort?: (key: string) => void;
  className?: string;
}

const TRUNCATE_THRESHOLD = 30;
const TRUNCATE_LIMIT = 20;
const STICKY_KEY = "plotId";
const SELECTED_ROW = "bg-accent-green/[0.06]";

function isCoordinateColumn(key: string): boolean {
  const col = key.toLowerCase();
  return col.includes("lat") || col.includes("lon") || col.includes("centroid");
}

function formatNumber(key: string, value: number): string {
  if (isCoordinateColumn(key)) return String(value);
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
    useGrouping: true,
  }).format(value);
}

function renderYesNo(value: unknown) {
  return isTruthyCell(value) ? (
    <span className="text-[11px] text-accent-green">yes</span>
  ) : (
    <span className="text-[11px] text-[#3d4e56]">no</span>
  );
}

function renderText(text: string) {
  if (text.length > TRUNCATE_THRESHOLD) {
    const truncated =
      text.length > TRUNCATE_LIMIT ? `${text.slice(0, TRUNCATE_LIMIT)}…` : text;
    return (
      <span className="text-[11px] text-text-muted" title={text}>
        {truncated}
      </span>
    );
  }
  return <span className="text-[11px] text-text-muted">{text}</span>;
}

function renderCell(value: unknown, type?: string, key?: string) {
  if (value === null || value === undefined) {
    return <span className="text-text-muted">—</span>;
  }

  if (type === "bool" || isYesNoCell(value)) {
    return renderYesNo(value);
  }

  if (type === "numeric" && typeof value === "number") {
    const formatted = formatNumber(key ?? "", value);
    return (
      <span className="font-mono text-[11px] text-text-muted tabular-nums">
        {formatted}
      </span>
    );
  }

  if (key?.startsWith("risk_")) {
    const { level, label } = riskFromValue(value);
    return <RiskBadge level={level} label={label} />;
  }

  return renderText(String(value));
}

export function ResultsTable({
  columns,
  visibleCols,
  data,
  presenceRows,
  selectedRowId,
  onSelectRow,
  sortColumn,
  sortAsc,
  onSort,
  className,
}: ResultsTableProps) {
  const presence = presenceRows ?? data;
  const visibleColumns = useMemo(
    () =>
      columns.filter((c) => {
        if (!visibleCols.includes(c.key)) return false;
        if (c.key === "external_id") {
          return presence.some((row) => {
            const v = row[c.key];
            return v !== null && v !== undefined && String(v).trim() !== "";
          });
        }
        return true;
      }),
    [columns, visibleCols, presence]
  );
  const idKey = STICKY_KEY;
  return (
    <ScrollArea horizontal className={cn("min-h-0 flex-1", className)}>
      <Table scrollable={false} className="w-max min-w-full border-separate border-spacing-0 text-xs">
        <TableHeader>
          <TableRow className="bg-surface">
            {visibleColumns.map((col) => (
              <TableHead
                key={col.key}
                onClick={() => onSort?.(col.key)}
                className={cn(
                  "cursor-pointer border-b border-border border-r border-border px-[14px] py-2 text-left text-[10px] font-semibold uppercase tracking-[0.07em] text-text-muted transition-colors last:border-r-0 hover:text-text-primary select-none whitespace-nowrap",
                  "sticky top-0 z-20 bg-surface",
                  col.key === STICKY_KEY && "left-0 z-30 bg-surface"
                )}
              >
                <span className="flex items-center gap-[3px]">
                  {col.header}
                  {sortColumn === col.key && (
                    <svg
                      width="9"
                      height="9"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="text-accent-green"
                    >
                      {sortAsc ? (
                        <polyline points="18 15 12 9 6 15" />
                      ) : (
                        <polyline points="6 9 12 15 18 9" />
                      )}
                    </svg>
                  )}
                </span>
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((row, idx) => {
            const rowId = String(row[idKey] ?? idx);
            const isSelected = selectedRowId === rowId;
            return (
              <TableRow
                key={rowId}
                onClick={() => onSelectRow?.(isSelected ? null : row)}
                className={cn(
                  "cursor-pointer border-b border-border transition-colors hover:bg-surface",
                  isSelected && SELECTED_ROW
                )}
              >
                {visibleColumns.map((col) => (
                  <TableCell
                    key={col.key}
                    className={cn(
                      "px-[14px] py-[7px] whitespace-nowrap border-b border-border border-r border-white/[0.03] last:border-r-0",
                      col.key === STICKY_KEY && "sticky left-0 z-10 bg-surface",
                      col.key === STICKY_KEY && isSelected && SELECTED_ROW,
                      col.key === STICKY_KEY && isSelected && "border-l-2 border-l-accent-green"
                    )}
                  >
                    {renderCell(row[col.key], col.type, col.key)}
                  </TableCell>
                ))}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </ScrollArea>
  );
}
