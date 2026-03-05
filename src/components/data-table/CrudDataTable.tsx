"use client"

import React, { useCallback, useMemo, useState } from "react"
import { ColumnDef } from "@tanstack/react-table"
import { Eye, Pencil, Trash2 } from "lucide-react"
import { DataTable } from "./DataTable"
import { DeleteConfirmModal } from "@/components/ui/DeleteConfirmModal"
import { Button } from "@/components/ui/Button"
import type { ReactNode } from "react"

type ServerActionResult = { ok: boolean; error?: string }

function capitalize(s: string) {
  return s.replace(/\b\w/g, (c) => c.toUpperCase());
}

function pluralize(s: string) {
  if (s.endsWith('s') || s.endsWith('x') || s.endsWith('sh') || s.endsWith('ch')) return s + 'es';
  if (s.endsWith('y') && !/[aeiou]y$/i.test(s)) return s.slice(0, -1) + 'ies';
  return s + 's';
}

interface CrudDataTableProps<TData> {
  entityLabel: string
  columns: ColumnDef<TData, any>[]
  data: TData[]
  title?: string
  isAdmin?: boolean
  searchFields?: string[]
  toolbarActions?: ReactNode
  deleteAction?: (id: string) => Promise<ServerActionResult>
  onAfterDelete?: () => Promise<void>
  onEdit?: (id: string) => void
  onView?: (id: string) => void
  onCreate?: () => void
  getRowId?: (row: TData) => string
}

export function CrudDataTable<TData>({
  entityLabel,
  columns,
  data,
  title,
  isAdmin = false,
  searchFields,
  toolbarActions,
  deleteAction,
  onAfterDelete,
  onEdit,
  onView,
  onCreate,
  getRowId: getRowIdProp,
}: CrudDataTableProps<TData>) {
  const getRowId = getRowIdProp ?? ((row: TData) => (row as any).id as string);

  // --- Delete state ---
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteConfirmId || !deleteAction) return;
    setDeleteLoading(true);
    setDeleteError(null);
    try {
      const result = await deleteAction(deleteConfirmId);
      if (!result.ok) throw new Error(result.error ?? `Failed to delete ${entityLabel}`);
      await onAfterDelete?.();
      setDeleteConfirmId(null);
    } catch (error) {
      setDeleteError(error instanceof Error ? error.message : 'An error occurred while deleting');
    } finally {
      setDeleteLoading(false);
    }
  }, [deleteConfirmId, deleteAction, entityLabel, onAfterDelete]);

  // --- Action column ---
  const hasActions = !!(onEdit || deleteAction || onView);

  const allColumns = useMemo(() => {
    if (!hasActions) return columns;

    const actionColumn: ColumnDef<TData, unknown> = {
      id: '_actions',
      header: () => <div className="text-right">Actions</div>,
      enableSorting: false,
      enableGlobalFilter: false,
      cell: ({ row }) => {
        const id = getRowId(row.original);
        return (
          <div className="flex items-center justify-end gap-2 text-gray-200">
            {isAdmin && onEdit && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onEdit(id); }}
                className="text-blue-400 hover:text-blue-300 p-1"
                title="Edit"
                aria-label="Edit"
              >
                <Pencil className="h-4 w-4" />
              </button>
            )}
            {!isAdmin && onView && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onView(id); }}
                className="text-blue-400 hover:text-blue-300 p-1"
                title="View"
                aria-label="View"
              >
                <Eye className="h-4 w-4" />
              </button>
            )}
            {isAdmin && deleteAction && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setDeleteConfirmId(id); }}
                className="text-red-400 hover:text-red-300 p-1"
                title="Delete"
                aria-label="Delete"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
        );
      },
    };

    return [...columns, actionColumn] as ColumnDef<TData, any>[];
  }, [columns, hasActions, getRowId, isAdmin, onEdit, deleteAction, onView]);

  // --- Derived labels ---
  const entityPlural = pluralize(entityLabel);

  // --- Create button as toolbar action ---
  const combinedToolbarActions = (
    <>
      {toolbarActions}
      {isAdmin && onCreate && (
        <Button onClick={onCreate} size="sm" className="bg-indigo-600 hover:bg-indigo-700">
          Add {capitalize(entityLabel)}
        </Button>
      )}
    </>
  );

  return (
    <DataTable
      columns={allColumns}
      data={data}
      title={title}
      searchFields={searchFields}
      toolbarActions={combinedToolbarActions}
      emptyMessage={`No ${entityPlural}.`}
      noMatchMessage={`No ${entityPlural} match your search.`}
    >
      {isAdmin && deleteConfirmId && (
        <DeleteConfirmModal
          itemName={deleteConfirmId}
          entityLabel={entityLabel}
          loading={deleteLoading}
          error={deleteError}
          onConfirm={handleDeleteConfirm}
          onCancel={() => { setDeleteConfirmId(null); setDeleteError(null); }}
        />
      )}
    </DataTable>
  );
}
