"use client";

import { useState } from 'react';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useResultColumns } from '@/lib/contexts/ResultColumnsContext';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/Table';
import Alert from '@/components/Alert';

type Mode = 'list' | 'edit' | 'create';
type MessageType = { type: 'success' | 'error'; text: string } | null;

const BASIC_FIELDS = [
  { key: 'type', label: 'Type', span: 1 },
  { key: 'unit', label: 'Unit', span: 1 },
  { key: 'description', label: 'Description', span: 2 },
  { key: 'period', label: 'Period', span: 1 },
  { key: 'source', label: 'Source', span: 1 },
  { key: 'dashboard', label: 'Dashboard', span: 1 },
];

const CROP_TYPES = ['pcrop', 'acrop', 'timber'];
const CROP_LABELS = { pcrop: 'P.Crop', acrop: 'A.Crop', timber: 'Timber' };

function ResultColumnsContent() {
  const { isAdmin } = useAuth();
  const { columns, isLoading, updateColumn, deleteColumn, addColumn } = useResultColumns();
  const [mode, setMode] = useState<Mode>('list');
  const [editingColumn, setEditingColumn] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<any>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [message, setMessage] = useState<MessageType>(null);
  const [loading, setLoading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  if (!isAdmin) {
    return (
      <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
        <div className="bg-gray-800 rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-semibold text-white mb-4">Access Denied</h2>
          <p className="text-gray-400">You must be an administrator to access this page.</p>
        </div>
      </div>
    );
  }

  const resetForm = () => {
    setMode('list');
    setEditingColumn(null);
    setEditForm({});
  };

  const startEdit = (columnName: string) => {
    setMode('edit');
    setEditingColumn(columnName);
    setEditForm(columns[columnName] || {});
    setMessage(null);
  };

  const startCreate = () => {
    setMode('create');
    setEditForm({ cropMetadata: {} });
    setMessage(null);
  };

  const updateField = (key: string, value: string) => {
    setEditForm({ ...editForm, [key]: value });
  };

  const updateCropMetadata = (cropType: string, field: string, value: string) => {
    setEditForm({
      ...editForm,
      cropMetadata: {
        ...editForm.cropMetadata,
        [cropType]: { ...editForm.cropMetadata?.[cropType], [field]: value }
      }
    });
  };

  const handleSave = async () => {
    setLoading(true);
    setMessage(null);

    try {
      if (mode === 'create' && !editForm.columnName) {
        throw new Error('Column name is required');
      }

      const url = mode === 'create' ? '/api/admin/result-columns' : `/api/admin/result-columns/${editingColumn}`;
      const method = mode === 'create' ? 'POST' : 'PATCH';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm)
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || `Failed to ${mode === 'create' ? 'create' : 'update'} column`);
      }

      const data = await response.json();
      const column = data.data?.column;

      if (column) {
        if (mode === 'create') {
          addColumn(column);
        } else {
          updateColumn(editingColumn!, column);
        }
      }

      setMessage({ type: 'success', text: `Column ${mode === 'create' ? 'created' : 'updated'} successfully` });
      resetForm();
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'An error occurred' });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (columnName: string) => {
    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch(`/api/admin/result-columns/${columnName}`, { method: 'DELETE' });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to delete column');
      }

      deleteColumn(columnName);
      setDeleteConfirm(null);
      setMessage({ type: 'success', text: 'Column deleted successfully' });
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'An error occurred while deleting' });
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = () => {
    const headers = [
      'column_name',
      'type',
      'unit',
      'description',
      'period',
      'source',
      'dashboard',
      'pcrop_used_for_risk',
      'pcrop_data_theme',
      'acrop_used_for_risk',
      'acrop_data_theme',
      'timber_used_for_risk',
      'timber_data_theme',
      'comments'
    ];

    const rows = Object.entries(columns)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([name, col]) => [
        name,
        col.type || '',
        col.unit || '',
        col.description || '',
        col.period || '',
        col.source || '',
        col.dashboard || '',
        col.cropMetadata?.pcrop?.used_for_risk || '',
        col.cropMetadata?.pcrop?.data_theme || '',
        col.cropMetadata?.acrop?.used_for_risk || '',
        col.cropMetadata?.acrop?.data_theme || '',
        col.cropMetadata?.timber?.used_for_risk || '',
        col.cropMetadata?.timber?.data_theme || '',
        col.comments || ''
      ]);

    const escapeCSV = (value: string) => {
      if (value.includes(',') || value.includes('"') || value.includes('\n')) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    };

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(escapeCSV).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `result_columns_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredColumns = Object.entries(columns)
    .filter(([name]) => name.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort(([a], [b]) => a.localeCompare(b));

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">Result Columns Administration</h1>
          <p className="mt-2 text-gray-400">Manage metadata for analysis result columns</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleExportCSV}
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
            disabled={Object.keys(columns).length === 0}
          >
            Export CSV
          </button>
          <button
            onClick={startCreate}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
          >
            + Add Column
          </button>
        </div>
      </div>

      {message && <Alert type={message.type} message={message.text} onClose={() => setMessage(null)} />}

      {mode !== 'list' ? (
        <div className="bg-gray-800 rounded-lg shadow-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold text-white">
              {mode === 'create' ? 'Create New Column' : `Editing: ${editingColumn}`}
            </h2>
            <button onClick={resetForm} className="text-gray-400 hover:text-gray-200">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {mode === 'create' && (
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-300 mb-1">Column Name *</label>
                <Input
                  value={editForm.columnName || ''}
                  onChange={(e) => updateField('columnName', e.target.value)}
                  className="bg-gray-700"
                  placeholder="e.g., TMF_def_2025"
                  required
                />
              </div>
            )}

            {BASIC_FIELDS.map(({ key, label, span }) => (
              <div key={key} className={span === 2 ? 'md:col-span-2' : ''}>
                <label className="block text-sm font-medium text-gray-300 mb-1">{label}</label>
                <Input
                  value={editForm[key] || ''}
                  onChange={(e) => updateField(key, e.target.value)}
                  className="bg-gray-700"
                />
              </div>
            ))}

            <div className="md:col-span-2">
              <h3 className="text-lg font-medium text-white mb-3 mt-2">Crop Metadata</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-900 rounded-lg border border-gray-700">
                {CROP_TYPES.map((cropType) => (
                  <div key={cropType}>
                    <h4 className="text-sm font-medium text-gray-400 mb-2">{CROP_LABELS[cropType as keyof typeof CROP_LABELS]}</h4>
                    <div className="space-y-2">
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">Used for Risk</label>
                        <Input
                          value={editForm.cropMetadata?.[cropType]?.used_for_risk || ''}
                          onChange={(e) => updateCropMetadata(cropType, 'used_for_risk', e.target.value)}
                          className="bg-gray-800"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">Data Theme</label>
                        <Input
                          value={editForm.cropMetadata?.[cropType]?.data_theme || ''}
                          onChange={(e) => updateCropMetadata(cropType, 'data_theme', e.target.value)}
                          className="bg-gray-800"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-300 mb-1">Comments</label>
              <Input
                value={editForm.comments || ''}
                onChange={(e) => updateField('comments', e.target.value)}
                className="bg-gray-700"
              />
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-2">
            <Button
              onClick={resetForm}
              disabled={loading}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={loading}
              className={`px-4 py-2 ${loading ? 'bg-indigo-800' : 'bg-indigo-600 hover:bg-indigo-700'} text-white rounded-md transition-colors`}
            >
              {loading && (
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              )}
              {loading ? 'Saving...' : (mode === 'create' ? 'Create Column' : 'Save Changes')}
            </Button>
          </div>
        </div>
      ) : (
        <div className="bg-gray-800 rounded-lg shadow-lg p-6">
          <div className="mb-4">
            <Input
              placeholder="Search columns..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-gray-700"
            />
          </div>
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mx-auto" />
              <p className="mt-4 text-gray-300">Loading columns...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Column Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Unit</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Dashboard</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredColumns.map(([name, data]: [string, any]) => (
                    <TableRow key={name}>
                      <TableCell className="font-mono text-sm">{name}</TableCell>
                      <TableCell>{data.type || '-'}</TableCell>
                      <TableCell>{data.unit || '-'}</TableCell>
                      <TableCell className="truncate max-w-xs">{data.description || '-'}</TableCell>
                      <TableCell>{data.dashboard || '-'}</TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-2">
                          <Button
                            onClick={() => startEdit(name)}
                            size="sm"
                            className="bg-indigo-600 text-white hover:bg-indigo-700"
                          >
                            Edit
                          </Button>
                          <Button
                            onClick={() => setDeleteConfirm(name)}
                            size="sm"
                            className="bg-red-600 text-white hover:bg-red-700"
                          >
                            Delete
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredColumns.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-gray-400">
                        No columns found matching &quot;{searchTerm}&quot;
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      )}

      {deleteConfirm && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/70">
          <div className="bg-gray-800 rounded-lg shadow-lg p-6 w-full max-w-md mx-4 border border-gray-700">
            <h3 className="text-lg font-medium text-red-400 mb-4">Confirm Deletion</h3>
            <p className="text-gray-300 mb-6">
              Are you sure you want to delete the column <span className="font-mono text-white">{deleteConfirm}</span>? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-2">
              <Button
                onClick={() => setDeleteConfirm(null)}
                disabled={loading}
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
              >
                Cancel
              </Button>
              <Button
                onClick={() => handleDelete(deleteConfirm)}
                disabled={loading}
                className={`px-4 py-2 ${loading ? 'bg-red-800' : 'bg-red-600 hover:bg-red-700'} text-white rounded-md transition-colors`}
              >
                {loading ? 'Deleting...' : 'Delete Column'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ResultColumnsAdmin() {
  return (
    <ProtectedRoute>
      <ResultColumnsContent />
    </ProtectedRoute>
  );
}
