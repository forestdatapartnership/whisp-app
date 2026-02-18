'use client';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { formatDateTime } from '@/lib/utils/formatters';
import type { Commodity } from '@/types/models';

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
  const filtered = commodities.filter(
    (c) =>
      c.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-700">
      <div className="flex flex-wrap gap-4 justify-between items-center mb-4">
        <Input
          placeholder="Search by code or description"
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="max-w-xs bg-gray-700 border-gray-600"
        />
        <div className="flex gap-2">
          <Button variant="secondary" onClick={onExportCSV}>
            Export CSV
          </Button>
          {isAdmin && (
            <Button onClick={onCreate} className="bg-indigo-600 hover:bg-indigo-700">
              Add Commodity
            </Button>
          )}
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-700">
          <thead>
            <tr>
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-300">Code</th>
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-300">Description</th>
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-300">Updated</th>
              {isAdmin && (
                <th className="px-4 py-2 text-right text-sm font-medium text-gray-300">Actions</th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700">
            {filtered.map((c) => (
              <tr key={c.code}>
                <td className="px-4 py-2 text-white font-mono">{c.code}</td>
                <td className="px-4 py-2 text-gray-300">{c.description ?? '—'}</td>
                <td className="px-4 py-2 text-gray-400 text-sm">{formatDateTime(c.updatedAt)}</td>
                {isAdmin && (
                  <td className="px-4 py-2 text-right">
                    <Button
                      variant="secondary"
                      className="mr-2"
                      onClick={() => onEdit(c.code)}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="secondary"
                      className="bg-red-900/50 hover:bg-red-800/50"
                      onClick={() => onDelete(c.code)}
                    >
                      Delete
                    </Button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <p className="py-4 text-center text-gray-400">No commodities found</p>
        )}
      </div>
    </div>
  );
}
