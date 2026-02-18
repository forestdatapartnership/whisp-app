'use client';

import { useState, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import { ArrowDown, ArrowUp, Pencil, Trash2 } from 'lucide-react';
import { formatDateTime } from '@/lib/utils/formatters';
import type { Commodity } from '@/types/models';

type SortKey = 'code' | 'description' | 'updatedAt';
type SortDir = 'asc' | 'desc';

interface CommoditiesTableProps {
  commodities: Commodity[];
  searchTerm: string;
  isAdmin: boolean;
  onSearchChange: (value: string) => void;
  onEdit: (code: string) => void;
  onDelete: (code: string) => void;
  onExportCSV: () => void;
  onCreate: () => void;
}

const SEARCH_DEBOUNCE_MS = 200;

export function CommoditiesTable({
  commodities,
  searchTerm,
  isAdmin,
  onSearchChange,
  onEdit,
  onDelete,
  onExportCSV,
  onCreate,
}: CommoditiesTableProps) {
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
      commodities.filter(
        (c) =>
          c.code?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
          c.description?.toLowerCase().includes(debouncedSearch.toLowerCase())
      ),
    [commodities, debouncedSearch]
  );

  const sorted = useMemo(() => {
    if (!sortKey) return filtered;
    return [...filtered].sort((a, b) => {
      const aVal = a[sortKey];
      const bVal = b[sortKey];
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
        <h2 className="text-xl font-semibold text-white mb-3">Commodities</h2>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Input
            placeholder="Search by code or description"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="max-w-xs bg-gray-700 border-gray-600"
          />
          <div className="flex items-center gap-3">
            <Button variant="secondary" size="sm" onClick={onExportCSV}>
              Export CSV
            </Button>
            {isAdmin && (
              <Button onClick={onCreate} size="sm" className="bg-indigo-600 hover:bg-indigo-700">
                Add Commodity
              </Button>
            )}
          </div>
        </div>
      </div>
      {sorted.length === 0 ? (
        <p className="text-gray-400 py-4">
          {commodities.length === 0 ? 'No commodities.' : 'No commodities match your search.'}
        </p>
      ) : (
        <Table className="text-xs">
          <TableHeader>
            <TableRow>
              <SortHeader label="Code" column="code" className="w-[180px]" />
              <SortHeader label="Description" column="description" />
              <SortHeader label="Last modified" column="updatedAt" />
              {isAdmin && (
                <TableHead className="text-right">Actions</TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {sorted.map((c) => (
              <TableRow key={c.code} className="hover:bg-gray-700/50">
                <TableCell className="font-mono text-gray-100 max-w-[180px] truncate" title={c.code ?? undefined}>
                  {c.code}
                </TableCell>
                <TableCell className="text-gray-200 max-w-[200px]">
                  <span className="block truncate" title={c.description ?? undefined}>
                    {c.description ?? '—'}
                  </span>
                </TableCell>
                <TableCell
                  className="text-gray-400"
                  title={c.updatedBy ? `by ${c.updatedBy}` : undefined}
                >
                  {formatDateTime(c.updatedAt)}
                </TableCell>
                {isAdmin && (
                  <TableCell className="flex items-center justify-end gap-2 text-gray-200">
                    <button
                      type="button"
                      onClick={() => onEdit(c.code)}
                      className="text-blue-400 hover:text-blue-300 p-1"
                      title="Edit"
                      aria-label="Edit"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(c.code)}
                      className="text-red-400 hover:text-red-300 p-1"
                      title="Delete"
                      aria-label="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
