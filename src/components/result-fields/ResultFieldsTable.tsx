'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import { Eye, Pencil, Plus, Trash2 } from 'lucide-react';
import type { ResultField } from '@/types/models';

interface ResultFieldsTableProps {
  fields: ResultField[];
  searchTerm: string;
  isAdmin: boolean;
  onSearchChange: (value: string) => void;
  onOpen: (code: string, asReadonly: boolean) => void;
  onDelete: (code: string) => void;
  onExportCSV: () => void;
  onExportWhispLookups?: () => void;
  onCreate: () => void;
}

const SEARCH_DEBOUNCE_MS = 200;

export function ResultFieldsTable({
  fields,
  searchTerm,
  isAdmin,
  onSearchChange,
  onOpen,
  onDelete,
  onExportCSV,
  onExportWhispLookups,
  onCreate,
}: ResultFieldsTableProps) {
  const [debouncedSearch, setDebouncedSearch] = useState(searchTerm);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchTerm), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [searchTerm]);

  const filtered = useMemo(
    () =>
      fields.filter(
        (f) =>
          f.code?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
          f.description?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
          f.type?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
          f.category?.toLowerCase().includes(debouncedSearch.toLowerCase())
      ),
    [fields, debouncedSearch]
  );

  return (
    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-white">Result Fields</h2>
        <div className="flex items-center gap-3">
          <Input
            placeholder="Search by code, category, description, or type"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="max-w-xs bg-gray-700 border-gray-600"
          />
          <Button variant="secondary" size="sm" onClick={onExportCSV}>
            Export CSV
          </Button>
          {onExportWhispLookups && (
            <Button variant="secondary" size="sm" onClick={onExportWhispLookups}>
              Whisp Lookups
            </Button>
          )}
          {isAdmin && (
            <Button onClick={onCreate} size="sm" className="bg-indigo-600 hover:bg-indigo-700">
              Add Result Field
            </Button>
          )}
        </div>
      </div>
      {filtered.length === 0 ? (
        <div>
          <p className="text-gray-400 mb-4">
            {fields.length === 0 ? 'No result fields yet.' : 'No result fields match your search.'}
          </p>
          {isAdmin && fields.length === 0 && (
            <Button onClick={onCreate} className="bg-indigo-600 hover:bg-indigo-700">
              <Plus className="h-4 w-4 mr-2" />
              Add first result field
            </Button>
          )}
        </div>
      ) : (
        <Table className="text-xs">
          <TableHeader>
            <TableRow>
              <TableHead>Order</TableHead>
              <TableHead className="w-[180px]">Code</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Unit</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((f) => (
              <TableRow key={f.code} className="hover:bg-gray-700/50">
                <TableCell className="text-gray-200">{f.order ?? '—'}</TableCell>
                <TableCell className="font-mono text-gray-100 max-w-[180px] truncate" title={f.code ?? undefined}>
                  {f.code}
                </TableCell>
                <TableCell className="text-gray-200">{f.category ?? '—'}</TableCell>
                <TableCell className="text-gray-200">{f.type ?? '—'}</TableCell>
                <TableCell className="text-gray-200">{f.unit ?? '—'}</TableCell>
                <TableCell className="text-gray-200 max-w-[200px]">
                  <span className="block truncate" title={f.description ?? undefined}>
                    {f.description ?? '—'}
                  </span>
                </TableCell>
                <TableCell className="flex items-center justify-end gap-2 text-gray-200">
                  <button
                    type="button"
                    onClick={() => onOpen(f.code!, !isAdmin)}
                    className="text-blue-400 hover:text-blue-300 p-1"
                    title={isAdmin ? 'Edit' : 'View'}
                    aria-label={isAdmin ? 'Edit' : 'View'}
                  >
                    {isAdmin ? <Pencil className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                  {isAdmin && (
                    <button
                      type="button"
                      onClick={() => onDelete(f.code!)}
                      className="text-red-400 hover:text-red-300 p-1"
                      title="Delete"
                      aria-label="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
