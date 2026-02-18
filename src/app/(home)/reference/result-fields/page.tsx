'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useResultFields } from '@/lib/contexts/ResultFieldsContext';
import {
  createResultFieldAction,
  updateResultFieldAction,
  deleteResultFieldAction,
} from './actions';
import { ResultFieldForm, ResultFieldsTable } from '@/components/result-fields';
import { DeleteConfirmModal } from '@/components/ui/DeleteConfirmModal';
import Alert from '@/components/Alert';
import { downloadCsv } from '@/lib/utils/downloadCsv';
import type { ResultField } from '@/types/models';

type Mode = 'list' | 'edit' | 'create';
type MessageType = { type: 'success' | 'error'; text: string } | null;

function ResultFieldsContent() {
  const router = useRouter();
  const { isAdmin } = useAuth();
  const { fields, commodities, refresh } = useResultFields();
  const fieldsList = useMemo(() => Object.values(fields), [fields]);
  const [mode, setMode] = useState<Mode>('list');
  const [editingCode, setEditingCode] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<ResultField>>({});
  const [readonlyForm, setReadonlyForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [message, setMessage] = useState<MessageType>(null);
  const [loading, setLoading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const resetForm = useCallback(() => {
    setMode('list');
    setEditingCode(null);
    setEditForm({});
    setReadonlyForm(false);
  }, []);

  const openField = useCallback((code: string, asReadonly: boolean) => {
    const f = fields[code];
    if (f) {
      setMode('edit');
      setEditingCode(code);
      setEditForm(f);
      setReadonlyForm(asReadonly);
      setMessage(null);
    }
  }, [fields]);

  const startCreate = useCallback(() => {
    setMode('create');
    setEditForm({});
    setReadonlyForm(false);
    setMessage(null);
  }, []);

  const updateField = useCallback((key: keyof ResultField, value: string | number | boolean | object | undefined | null) => {
    setEditForm((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handleSave = useCallback(async () => {
    setLoading(true);
    setMessage(null);

    try {
      if (mode === 'create' && !editForm.code) {
        throw new Error('Code is required');
      }

      if (mode === 'create') {
        const field: Omit<ResultField, 'updatedAt' | 'updatedBy'> = {
          code: editForm.code!,
          type: editForm.type,
          unit: editForm.unit,
          description: editForm.description,
          category: editForm.category,
          order: editForm.order,
          iso2Code: editForm.iso2Code,
          period: editForm.period,
          source: editForm.source,
          comments: editForm.comments,
          powerBiMetadata: editForm.powerBiMetadata,
          commodityMetadata: editForm.commodityMetadata,
          displayMetadata: editForm.displayMetadata,
          analysisMetadata: editForm.analysisMetadata,
        };
        const result = await createResultFieldAction(field);
        if (!result.ok) throw new Error(result.error);
        await refresh();
        setMessage({ type: 'success', text: 'Result field created successfully' });
      } else {
        const updates: Partial<ResultField> = {
          type: editForm.type,
          unit: editForm.unit,
          description: editForm.description,
          category: editForm.category,
          order: editForm.order,
          iso2Code: editForm.iso2Code,
          period: editForm.period,
          source: editForm.source,
          comments: editForm.comments,
          powerBiMetadata: editForm.powerBiMetadata,
          commodityMetadata: editForm.commodityMetadata,
          displayMetadata: editForm.displayMetadata,
          analysisMetadata: editForm.analysisMetadata,
        };
        const result = await updateResultFieldAction(editingCode!, updates);
        if (!result.ok) throw new Error(result.error);
        await refresh();
        setMessage({ type: 'success', text: 'Result field updated successfully' });
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
      const result = await deleteResultFieldAction(code);
      if (!result.ok) throw new Error(result.error);
      await refresh();
      setDeleteConfirm(null);
      setMessage({ type: 'success', text: 'Result field deleted successfully' });
      router.refresh();
    } catch (error: unknown) {
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'An error occurred while deleting' });
    } finally {
      setLoading(false);
    }
  }, [refresh, router]);

  const handleExportWhispLookups = useCallback(async () => {
    const files = [
      { url: '/api/result-fields/lookup-context-and-metadata', name: 'lookup_context_and_metadata.csv' },
      { url: '/api/result-fields/lookup-gee-datasets', name: 'lookup_gee_datasets.csv' },
    ];
    for (const { url, name } of files) {
      const res = await fetch(url);
      if (!res.ok) return;
      const blob = await res.blob();
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = name;
      a.click();
      URL.revokeObjectURL(a.href);
    }
  }, []);

  const handleExportCSV = useCallback(() => {
    const baseHeaders = ['code', 'type', 'unit', 'description', 'category', 'order', 'iso2Code', 'period', 'source', 'comments', 'createdAt', 'createdBy', 'updatedAt', 'updatedBy'];
    const powerBiHeaders = ['powerBiMetadata.dashboard'];
    const displayHeaders = ['displayMetadata.displayName', 'displayMetadata.excludeFromResults', 'displayMetadata.visibleByDefault'];
    const sortedCommodities = [...commodities].sort((a, b) => a.code.localeCompare(b.code));
    const commodityHeaders = sortedCommodities.flatMap((c) => [`commodityMetadata.${c.code}.usedForRisk`, `commodityMetadata.${c.code}.dataTheme`]);
    const analysisHeaders = ['analysisMetadata.type', 'analysisMetadata.excludeFromOutput', 'analysisMetadata.isNullable', 'analysisMetadata.isRequired', 'analysisMetadata.correspondingVariable', 'analysisMetadata.geeAssets'];
    const header = [...baseHeaders, ...powerBiHeaders, ...displayHeaders, ...commodityHeaders, ...analysisHeaders];

    const toVal = (v: unknown): string | number => (v == null ? '' : typeof v === 'object' ? JSON.stringify(v) : String(v));
    const formatDate = (d: Date | string | undefined) => (d ? new Date(d).toISOString() : '');

    const rows = fieldsList
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0) || (a.code ?? '').localeCompare(b.code ?? ''))
      .map((f) => {
        const base = [
          f.code ?? '',
          f.type ?? '',
          f.unit ?? '',
          f.description ?? '',
          f.category ?? '',
          f.order ?? '',
          f.iso2Code ?? '',
          f.period ?? '',
          f.source ?? '',
          f.comments ?? '',
          formatDate(f.createdAt),
          f.createdBy ?? '',
          formatDate(f.updatedAt),
          f.updatedBy ?? '',
        ];
        const powerBi = [toVal(f.powerBiMetadata?.dashboard)];
        const display = [f.displayMetadata?.displayName ?? '', toVal(f.displayMetadata?.excludeFromResults), toVal(f.displayMetadata?.visibleByDefault)];
        const commodityVals = sortedCommodities.flatMap((c) => {
          const m = f.commodityMetadata?.[c.code];
          return [toVal(m?.usedForRisk), m?.dataTheme ?? ''];
        });
        const analysis = [
          f.analysisMetadata?.type ?? '',
          toVal(f.analysisMetadata?.excludeFromOutput),
          toVal(f.analysisMetadata?.isNullable),
          toVal(f.analysisMetadata?.isRequired),
          f.analysisMetadata?.correspondingVariable ?? '',
          f.analysisMetadata?.geeAssets != null ? JSON.stringify(f.analysisMetadata.geeAssets) : '',
        ];
        return [...base, ...powerBi, ...display, ...commodityVals, ...analysis];
      });
    downloadCsv(header, rows, `result_fields_${new Date().toISOString().split('T')[0]}.csv`);
  }, [fieldsList, commodities]);

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
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
      {message && <Alert type={message.type} message={message.text} onClose={() => setMessage(null)} />}

      {(mode === 'create' || mode === 'edit') ? (
        <ResultFieldForm
          mode={readonlyForm ? 'readonly' : mode}
          editingCode={editingCode ?? undefined}
          editForm={editForm}
          loading={loading}
          onFieldChange={updateField}
          onSave={handleSave}
          onCancel={resetForm}
          onEdit={readonlyForm && isAdmin ? () => openField(editingCode!, false) : undefined}
        />
      ) : (
        <ResultFieldsTable
          fields={fieldsList}
          searchTerm={searchTerm}
          isAdmin={isAdmin}
          onSearchChange={setSearchTerm}
          onOpen={openField}
          onDelete={setDeleteConfirm}
          onExportCSV={handleExportCSV}
          onExportWhispLookups={handleExportWhispLookups}
          onCreate={startCreate}
        />
      )}

      {isAdmin && deleteConfirm && (
        <DeleteConfirmModal
          itemName={deleteConfirm}
          entityLabel="result field"
          loading={loading}
          onConfirm={() => handleDelete(deleteConfirm)}
          onCancel={() => setDeleteConfirm(null)}
        />
      )}
    </div>
  );
}

export default function ResultFieldsPage() {
  return <ResultFieldsContent />;
}
