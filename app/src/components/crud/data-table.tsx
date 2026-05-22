"use client";

import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Alert } from "@/components/ui/alert";
import { Pencil, Trash2, Plus, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatSystemMessage } from "@/types/system-codes";
import type { ActionResult } from "@/types/action-result";

export interface ColumnDef<T> {
  key: keyof T | string;
  header: string;
  render?: (row: T) => React.ReactNode;
}

interface DataTableProps<T extends { id: string }> {
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
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        {isAdmin && onCreate && (
          <Button onClick={onCreate}>
            <Plus className="size-4" />
            New
          </Button>
        )}
      </div>

      {error && (
        <Alert type="error" message={error} onClose={() => setError(null)} />
      )}

      <div className="overflow-x-auto rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow className="bg-surface">
              {columns.map((col) => (
                <TableHead key={String(col.key)} className="whitespace-nowrap">
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
              <TableRow key={row.id} className="hover:bg-muted/30">
                {columns.map((col) => (
                  <TableCell key={String(col.key)} className="whitespace-nowrap">
                    {col.render
                      ? col.render(row)
                      : String(getValue(row, col.key) ?? "—")}
                  </TableCell>
                ))}
                {(onEdit || onView || deleteAction) && (
                  <TableCell className="flex items-center gap-1">
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
      </div>
    </div>
  );
}
