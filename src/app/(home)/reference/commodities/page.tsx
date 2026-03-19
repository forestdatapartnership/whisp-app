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
import { CommodityForm } from '@/components/commodities';
import { CrudDataTable } from '@/components/data-table/CrudDataTable';
import Alert from '@/components/shared/Alert';
import { codeColumn, truncatedTextColumn, lastModifiedColumn } from '@/components/data-table/columnHelpers';
import type { Commodity } from '@/types/models';

const commodityColumns = [
  codeColumn<Commodity>('id', 'Code'),
  truncatedTextColumn<Commodity>('description', 'Description'),
  lastModifiedColumn<Commodity>(),
];

type Mode = 'list' | 'edit' | 'create';
type MessageType = { type: 'success' | 'error'; text: string } | null;

function CommoditiesContent() {
  const router = useRouter();
  const { isAdmin } = useAuth();
  const { commodities, refresh } = useResultFields();
  const [mode, setMode] = useState<Mode>('list');
  const [editingCode, setEditingCode] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Commodity>>({});
  const [message, setMessage] = useState<MessageType>(null);
  const [loading, setLoading] = useState(false);

  const resetForm = useCallback(() => {
    setMode('list');
    setEditingCode(null);
    setEditForm({});
  }, []);

  const startEdit = useCallback((code: string) => {
    const c = commodities.find((ct) => ct.id === code);
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
      if (mode === 'create' && !editForm.id) {
        throw new Error('Code is required');
      }
      const commodity: Omit<Commodity, 'updatedAt' | 'updatedBy'> = {
        id: editForm.id!,
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

  const afterMutate = useCallback(async () => {
    await refresh();
    router.refresh();
  }, [refresh, router]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && mode !== 'list') resetForm();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [mode, resetForm]);

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
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
        <CrudDataTable<Commodity>
          entityLabel="commodity"
          columns={commodityColumns}
          data={commodities}
          title="Commodities"
          isAdmin={isAdmin}
          searchFields={['id', 'description']}
          deleteAction={deleteCommodityAction}
          onAfterDelete={afterMutate}
          onEdit={startEdit}
          onCreate={startCreate}
        />
      )}
    </div>
  );
}

export default function CommoditiesPage() {
  return <CommoditiesContent />;
}
