'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useResultFields } from '@/lib/contexts/ResultFieldsContext';
import {
  createCommodityAction,
  updateCommodityAction,
  deleteCommodityAction,
} from './actions';
import { CommodityForm, CommoditiesTable } from '@/components/commodities';
import { DeleteConfirmModal } from '@/components/ui/DeleteConfirmModal';
import Alert from '@/components/Alert';
import { downloadCsv } from '@/lib/utils/downloadCsv';
import type { Commodity } from '@/types/models';

type Mode = 'list' | 'edit' | 'create';
type MessageType = { type: 'success' | 'error'; text: string } | null;

function CommoditiesContent() {
  const router = useRouter();
  const { isAdmin } = useAuth();
  const { commodities, refresh } = useResultFields();
  const [mode, setMode] = useState<Mode>('list');
  const [editingCode, setEditingCode] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Commodity>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [message, setMessage] = useState<MessageType>(null);
  const [loading, setLoading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const resetForm = useCallback(() => {
    setMode('list');
    setEditingCode(null);
    setEditForm({});
  }, []);

  const startEdit = useCallback((code: string) => {
    const c = commodities.find((ct) => ct.code === code);
    if (c) {
      setMode('edit');
      setEditingCode(code);
      setEditForm(c);
      setMessage(null);
    }
  }, [commodities]);

  const startCreate = useCallback(() => {
    setMode('create');
    setEditForm({});
    setMessage(null);
  }, []);

  const updateField = useCallback((key: string, value: string) => {
    setEditForm((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handleSave = useCallback(async () => {
    setLoading(true);
    setMessage(null);

    try {
      if (mode === 'create' && !editForm.code) {
        throw new Error('Code is required');
      }
      const commodity: Omit<Commodity, 'updatedAt' | 'updatedBy'> = {
        code: editForm.code!,
        description: editForm.description ?? undefined,
      };

      if (mode === 'create') {
        const result = await createCommodityAction(commodity);
        if (!result.ok) throw new Error(result.error);
        await refresh();
        setMessage({ type: 'success', text: 'Commodity created successfully' });
      } else {
        const result = await updateCommodityAction(editingCode!, {
          description: commodity.description,
        });
        if (!result.ok) throw new Error(result.error);
        await refresh();
        setMessage({ type: 'success', text: 'Commodity updated successfully' });
      }
      resetForm();
      router.refresh();
    } catch (error: unknown) {
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'An error occurred' });
    } finally {
      setLoading(false);
    }
  }, [mode, editForm, editingCode, refresh, resetForm, router]);

  const handleDelete = useCallback(async (code: string) => {
    setLoading(true);
    setMessage(null);

    try {
      const result = await deleteCommodityAction(code);
      if (!result.ok) throw new Error(result.error);
      await refresh();
      setDeleteConfirm(null);
      setMessage({ type: 'success', text: 'Commodity deleted successfully' });
      router.refresh();
    } catch (error: unknown) {
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'An error occurred while deleting' });
    } finally {
      setLoading(false);
    }
  }, [refresh, router]);

  const handleExportCSV = useCallback(() => {
    const header = ['code', 'description', 'updatedAt'];
    const rows = commodities
      .sort((a, b) => a.code.localeCompare(b.code))
      .map((c) => [
        c.code,
        c.description ?? '',
        c.updatedAt ? new Date(c.updatedAt).toISOString() : '',
      ]);
    downloadCsv(header, rows, `commodities_${new Date().toISOString().split('T')[0]}.csv`);
  }, [commodities]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (deleteConfirm) setDeleteConfirm(null);
        else if (mode !== 'list') resetForm();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [deleteConfirm, mode, resetForm]);

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
      {message && <Alert type={message.type} message={message.text} onClose={() => setMessage(null)} />}

      {isAdmin && mode !== 'list' ? (
        <CommodityForm
          mode={mode}
          editingCode={editingCode ?? undefined}
          editForm={editForm}
          loading={loading}
          onFieldChange={updateField}
          onSave={handleSave}
          onCancel={resetForm}
        />
      ) : (
        <CommoditiesTable
          commodities={commodities}
          searchTerm={searchTerm}
          isAdmin={isAdmin}
          onSearchChange={setSearchTerm}
          onEdit={startEdit}
          onDelete={setDeleteConfirm}
          onExportCSV={handleExportCSV}
          onCreate={startCreate}
        />
      )}

      {isAdmin && deleteConfirm && (
        <DeleteConfirmModal
          itemName={deleteConfirm}
          entityLabel="commodity"
          loading={loading}
          onConfirm={() => handleDelete(deleteConfirm)}
          onCancel={() => setDeleteConfirm(null)}
        />
      )}
    </div>
  );
}

export default function CommoditiesPage() {
  return <CommoditiesContent />;
}
