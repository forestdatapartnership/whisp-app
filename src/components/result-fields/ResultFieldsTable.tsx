'use client';

import { useState, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import { ArrowDown, ArrowUp, Eye, Pencil, Trash2 } from 'lucide-react';
import { formatDateTime } from '@/lib/utils/formatters';
import type { ResultField } from '@/types/models';

type SortKey = 'order' | 'code' | 'category' | 'description' | 'updatedAt';
type SortDir = 'asc' | 'desc';

interface ResultFieldsTableProps {
  fields: ResultField[];
  searchTerm: string;
  isAdmin: boolean;
  onSearchChange: (value: string) => void;
  onOpen: (code: string, asReadonly: boolean) => void;
  onDelete: (code: string) => void;
  onExportCSV: () => void;
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
  onCreate,
}: ResultFieldsTableProps) {
  const [debouncedSearch, setDebouncedSearch] = useState(searchTerm);
  const [sortKey, setSortKey] = useState<SortKey | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const SortHeader = ({ label, column, className }: { label: string; column: SortKey; className?: string }) => (
    <TableHead className={className}>
      <button type="button" onClick={() => handleSort(column)} className="flex items-center gap-1 hover:text-white transition-colors">
        {label}
        {sortKey === column && (sortDir === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />)}
      </button>
    </TableHead>
  );

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

  const sorted = useMemo(() => {
    if (!sortKey) return filtered;
    return [...filtered].sort((a, b) => {
      const aVal = a[sortKey];
      const bVal = b[sortKey];
      if (sortKey === 'order') {
        const aNum = typeof aVal === 'number' ? aVal : 0;
        const bNum = typeof bVal === 'number' ? bVal : 0;
        return sortDir === 'asc' ? aNum - bNum : bNum - aNum;
      }
      if (sortKey === 'updatedAt') {
        const aNum = aVal instanceof Date ? aVal.getTime() : aVal ? new Date(aVal as string).getTime() : 0;
        const bNum = bVal instanceof Date ? bVal.getTime() : bVal ? new Date(bVal as string).getTime() : 0;
        return sortDir === 'asc' ? aNum - bNum : bNum - aNum;
      }
      const aStr = (aVal ?? '').toString().toLowerCase();
      const bStr = (bVal ?? '').toString().toLowerCase();
      const cmp = aStr.localeCompare(bStr);
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [filtered, sortKey, sortDir]);

  return (
    <div className="bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-700">
      <div className="mb-4">
        <h2 className="text-xl font-semibold text-white mb-3">Result Fields</h2>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Input
              placeholder="Search by code, category, description, or type"
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="max-w-xs bg-gray-700 border-gray-600"
            />
          </div>
          <div className="flex items-center gap-3">
            <Button variant="secondary" size="sm" onClick={onExportCSV}>
              Export CSV
            </Button>
            {isAdmin && (
              <Button onClick={onCreate} size="sm" className="bg-indigo-600 hover:bg-indigo-700">
                Add Result Field
              </Button>
            )}
          </div>
        </div>
      </div>
      {sorted.length === 0 ? (
        <p className="text-gray-400 py-4">
          {fields.length === 0
            ? 'No result fields.'
            : 'No result fields match your search.'}
        </p>
      ) : (
        <Table className="text-xs">
          <TableHeader>
            <TableRow>
              <SortHeader label="Order" column="order" />
              <SortHeader label="Code" column="code" className="w-[180px]" />
              <SortHeader label="Category" column="category" />
              <SortHeader label="Description" column="description" />
              <SortHeader label="Last modified" column="updatedAt" />
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sorted.map((f) => (
              <TableRow key={f.code} className="hover:bg-gray-700/50">
                <TableCell className="text-gray-200">{f.order ?? '—'}</TableCell>
                <TableCell className="font-mono text-gray-100 max-w-[180px] truncate" title={f.code ?? undefined}>
                  {f.code}
                </TableCell>
                <TableCell className="text-gray-200">{f.category ?? '—'}</TableCell>
                <TableCell className="text-gray-200 max-w-[200px]">
                  <span className="block truncate" title={f.description ?? undefined}>
                    {f.description ?? '—'}
                  </span>
                </TableCell>
                <TableCell
                  className="text-gray-400"
                  title={f.updatedBy ? `by ${f.updatedBy}` : undefined}
                >
                  {formatDateTime(f.updatedAt)}
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
