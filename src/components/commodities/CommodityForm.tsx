'use client';

import { Button } from '@/components/ui/Button';
import { FormField } from '@/components/ui/FormField';
import type { Commodity } from '@/types/models';

interface CommodityFormProps {
  mode: 'create' | 'edit';
  editingCode?: string;
  editForm: Partial<Commodity>;
  loading: boolean;
  onFieldChange: (key: string, value: string) => void;
  onSave: () => void;
  onCancel: () => void;
}

export function CommodityForm({
  mode,
  editingCode,
  editForm,
  loading,
  onFieldChange,
  onSave,
  onCancel,
}: CommodityFormProps) {
  return (
    <div className="bg-gray-800 rounded-lg shadow-lg p-6 mb-6 border border-gray-700">
      <h2 className="text-xl font-semibold text-white mb-4">
        {mode === 'create' ? 'New Commodity' : `Edit ${editingCode}`}
      </h2>
      <div className="space-y-4">
        <FormField
          label="Code"
          value={editForm.code ?? ''}
          placeholder="e.g. pcrop"
          disabled={mode === 'edit'}
          onChange={(v) => onFieldChange('code', String(v))}
        />
        <FormField
          label="Description"
          value={editForm.description ?? ''}
          placeholder="Description"
          onChange={(v) => onFieldChange('description', String(v))}
        />
      </div>
      <div className="flex gap-2 mt-6">
        <Button onClick={onSave} disabled={loading} className="bg-indigo-600 hover:bg-indigo-700">
          {loading ? 'Saving...' : 'Save'}
        </Button>
        <Button variant="secondary" onClick={onCancel} disabled={loading}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
