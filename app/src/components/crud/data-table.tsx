"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert } from "@/components/ui/alert";
import { Pencil, Trash2, Plus, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { controlRounded } from "@/components/ui/styles";
import { formatSystemMessage } from "@/types/system-codes";
import type { ActionResult } from "@/types/action-result";

export interface ColumnDef<T> {
  key: keyof T | string;
  header: string;
  render?: (row: T) => React.ReactNode;
  truncate?: boolean;
}

interface DataTableProps<T extends { id: string }> {
  title?: string;
  entityLabel: string;
  columns: ColumnDef<T>[];
  data: T[];
  isAdmin: boolean;
  searchFields: (keyof T | string)[];
  onEdit?: (id: string) => void;
  onView?: (id: string) => void;
  onCreate?: () => void;
  deleteAction?: (id: string) => Promise<ActionResult<unknown>>;
  onAfterDelete?: () => void;
}

function getValue<T>(row: T, key: keyof T | string): unknown {
  return (row as Record<string, unknown>)[String(key)];
}

export function CrudDataTable<T extends { id: string }>({
  title,
  entityLabel,
  columns,
  data,
  isAdmin,
  searchFields,
  onEdit,
  onView,
  onCreate,
  deleteAction,
  onAfterDelete,
}: DataTableProps<T>) {
  const [search, setSearch] = useState("");
  const [deleting, setDeleting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const filtered = useMemo(() => {
    if (!search.trim()) return data;
    const q = search.toLowerCase();
    return data.filter((row) =>
      searchFields.some((field) =>
        String(getValue(row, field) ?? "").toLowerCase().includes(q)
      )
    );
  }, [data, search, searchFields]);

  const handleDelete = async (id: string) => {
    if (!deleteAction) return;
    if (!confirm(`Delete ${entityLabel} "${id}"?`)) return;
    setDeleting(id);
    setError(null);
    const result = await deleteAction(id);
    if (!result.ok) {
      setError(formatSystemMessage(result.code, result.args));
    } else {
      onAfterDelete?.();
    }
    setDeleting(null);
  };

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="flex shrink-0 items-center gap-2 border-b border-border bg-surface px-[14px] py-2">
        {title && <span className="text-sm font-semibold text-text-primary">{title}</span>}
        <span className="inline-flex items-center rounded-full border border-border bg-surface-raised px-[9px] py-[2px] text-[11px] text-text-muted">
          {filtered.length}
        </span>
      </div>

      <div className="flex shrink-0 items-center gap-2 border-b border-border bg-bg px-[18px] py-2.5">
        <div className="relative">
          <Search className="pointer-events-none absolute left-[9px] top-1/2 -translate-y-1/2 size-3.5 text-text-muted" />
          <input
            type="text"
            placeholder={`Search ${entityLabel}s…`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={`h-[30px] w-[180px] ${controlRounded} border border-border bg-surface pl-[30px] pr-[10px] text-xs text-text-primary outline-none transition-colors placeholder:text-text-muted/60 focus:border-accent-green`}
          />
        </div>
        <div className="flex-1" />
        {isAdmin && onCreate && (
          <Button size="sm" onClick={onCreate}>
            <Plus />
            New
          </Button>
        )}
      </div>

      {error && (
        <div className="shrink-0 px-[14px] py-2">
          <Alert type="error" message={error} onClose={() => setError(null)} />
        </div>
      )}

      <ScrollArea className="flex-1" horizontal>
        <Table>
          <TableHeader>
            <TableRow className="sticky top-0 border-b-2 border-border bg-surface">
              {columns.map((col) => (
                <TableHead key={String(col.key)} className="px-[14px] py-2 text-left text-[10px] font-semibold uppercase tracking-[0.07em] text-text-muted border-r border-border last:border-r-0 whitespace-nowrap">
                  {col.header}
                </TableHead>
              ))}
              {(onEdit || onView || deleteAction) && (
                <TableHead className="w-px" />
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((row) => (
              <TableRow key={row.id} className="border-b border-border transition-colors hover:bg-surface">
                {columns.map((col) => (
                  <TableCell key={String(col.key)} className={cn("px-[14px] py-[7px] text-[11px] text-text-muted border-r border-border/30 last:border-r-0", col.truncate ? "max-w-[260px]" : "whitespace-nowrap")}>
                    {col.truncate ? (
                      <span className="block truncate" title={String(getValue(row, col.key) ?? "")}>
                        {col.render ? col.render(row) : String(getValue(row, col.key) ?? "—")}
                      </span>
                    ) : (
                      col.render ? col.render(row) : String(getValue(row, col.key) ?? "—")
                    )}
                  </TableCell>
                ))}
                {(onEdit || onView || deleteAction) && (
                  <TableCell className="px-2 py-1">
                    {(onView || onEdit) && (
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        onClick={() =>
                          onEdit ? onEdit(row.id) : onView?.(row.id)
                        }
                        title={onEdit ? "Edit" : "View"}
                      >
                        <Pencil className="size-3.5" />
                      </Button>
                    )}
                    {isAdmin && deleteAction && (
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        onClick={() => handleDelete(row.id)}
                        disabled={deleting === row.id}
                        className="text-destructive hover:text-destructive"
                        title="Delete"
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    )}
                  </TableCell>
                )}
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={columns.length + (onEdit || deleteAction ? 1 : 0)}
                  className="py-8 text-center text-muted-foreground"
                >
                  No {entityLabel}s found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </ScrollArea>
    </div>
  );
}
