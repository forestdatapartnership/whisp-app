'use client';

import { Button } from '@/components/ui/Button';
import { FormField } from '@/components/ui/FormField';
import {
  DisplayMetadataSection,
  PowerBiMetadataSection,
  CommodityMetadataSection,
  AnalysisMetadataSection,
} from './metadata';
import type { ResultField } from '@/types/models';

const SECTIONS = [
  { id: 'section-general', label: 'General' },
  { id: 'section-content', label: 'Content' },
  { id: 'section-display', label: 'Display' },
  { id: 'section-powerbi', label: 'Power BI' },
  { id: 'section-commodity', label: 'Commodity' },
  { id: 'section-analysis', label: 'Analysis' },
] as const;

interface ResultFieldFormProps {
  mode: 'create' | 'edit' | 'readonly';
  editingCode?: string;
  editForm: Partial<ResultField>;
  loading?: boolean;
  onFieldChange?: (key: keyof ResultField, value: string | number | boolean | object | undefined | null) => void;
  onSave?: () => void;
  onCancel?: () => void;
  onEdit?: () => void;
}

const RESULT_FIELD_TYPES = ['numeric', 'char', 'bool'] as const;

const GRID_FIELDS: {
  key: keyof ResultField;
  label: string;
  type?: 'text' | 'number';
  placeholder?: string;
  disabledInEdit?: boolean;
  kind?: 'input' | 'textarea' | 'select';
  options?: readonly string[];
}[] = [
  { key: 'code', label: 'Code', placeholder: 'e.g. TMF_plant', disabledInEdit: true },
  { key: 'order', label: 'Order', type: 'number', placeholder: '0' },
  { key: 'type', label: 'Type', kind: 'select', options: RESULT_FIELD_TYPES, placeholder: 'Select type' },
  { key: 'unit', label: 'Unit', placeholder: 'e.g. ha / %' },
  { key: 'period', label: 'Period', placeholder: 'e.g. 2020' },
  { key: 'iso2Code', label: 'ISO2 Code', placeholder: 'ISO2 Code' },
  { key: 'category', label: 'Category', placeholder: 'e.g. indicators' },
  { key: 'description', label: 'Short description', placeholder: 'Short description' },
];

export function ResultFieldForm({
  mode = 'create',
  editingCode,
  editForm,
  loading = false,
  onFieldChange,
  onSave,
  onCancel,
  onEdit,
}: ResultFieldFormProps) {
  const readonly = mode === 'readonly';

  const formatDate = (v: Date | string | undefined) => (v ? new Date(v).toLocaleString() : '');

  const getValue = (key: keyof ResultField): string | number => {
    const v = editForm[key];
    if ((key === 'updatedAt' || key === 'createdAt') && v) return formatDate(v as string);
    return (v ?? '') as string | number;
  };

  return (
    <div className="bg-gray-800 rounded-lg shadow-lg mb-6 border border-gray-700">
      <div className="sticky top-0 z-10 bg-gray-800 rounded-t-lg border-b border-gray-700 px-6 py-4 -mt-px">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h2 className="text-xl font-semibold text-white">
            {mode === 'create' ? 'New Result Field' : mode === 'readonly' ? `Result Field: ${editingCode}` : `Edit ${editingCode}`}
          </h2>
          <nav className="flex flex-wrap gap-2">
            {SECTIONS.map(({ id, label }) => (
              <a
                key={id}
                href={`#${id}`}
                className="text-xs text-gray-400 hover:text-indigo-400 transition-colors"
              >
                {label}
              </a>
            ))}
          </nav>
        </div>
      </div>

      <div className="space-y-4 p-6">
        <div id="section-general" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 scroll-mt-24">
          {GRID_FIELDS.map(({ key, label, type = 'text', placeholder, disabledInEdit, kind = 'input', options }) =>
            kind === 'textarea' ? (
              <FormField
                key={key}
                kind="textarea"
                label={label}
                value={String(editForm[key] ?? '')}
                readonly={readonly}
                placeholder={placeholder}
                disabled={mode === 'edit' && disabledInEdit}
                onChange={(v: string) => !readonly && onFieldChange?.(key, v)}
              />
            ) : kind === 'select' && options ? (
              <FormField
                key={key}
                kind="select"
                label={label}
                value={String(editForm[key] ?? '')}
                readonly={readonly}
                options={[...options]}
                placeholder={placeholder}
                disabled={mode === 'edit' && disabledInEdit}
                onChange={(v) => !readonly && onFieldChange?.(key, v)}
              />
            ) : (
              <FormField
                key={key}
                label={label}
                value={getValue(key)}
                readonly={readonly}
                type={type}
                placeholder={placeholder}
                disabled={mode === 'edit' && disabledInEdit}
                onChange={(v) => !readonly && onFieldChange?.(key, v)}
              />
            )
          )}
        </div>

        <div id="section-content" className="space-y-4 scroll-mt-24">
          <FormField
            kind="textarea"
            label="Source"
            value={String(editForm.source ?? '')}
            readonly={readonly}
            placeholder="Source"
            onChange={(v) => onFieldChange?.('source', v)}
          />
          <FormField
            kind="textarea"
            label="Comments"
            value={String(editForm.comments ?? '')}
            readonly={readonly}
            placeholder="Comments"
            onChange={(v) => onFieldChange?.('comments', v)}
          />
        </div>

        <DisplayMetadataSection
          value={editForm.displayMetadata}
          code={editForm.code}
          readonly={readonly}
          onChange={(v) => onFieldChange?.('displayMetadata', v)}
        />
        <PowerBiMetadataSection
          value={editForm.powerBiMetadata}
          readonly={readonly}
          onChange={(v) => onFieldChange?.('powerBiMetadata', v)}
        />
        <CommodityMetadataSection
          value={editForm.commodityMetadata}
          readonly={readonly}
          onChange={(v) => onFieldChange?.('commodityMetadata', v)}
        />
        <AnalysisMetadataSection
          value={editForm.analysisMetadata}
          readonly={readonly}
          onChange={(v) => onFieldChange?.('analysisMetadata', v)}
        />
      </div>

      <div className="sticky bottom-0 z-10 bg-gray-800 rounded-b-lg border-t border-gray-700 px-6 py-4 -mb-px">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          {(mode === 'edit' || mode === 'readonly') && (
            <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-gray-400">
              <span>Created: {formatDate(editForm.createdAt)}{editForm.createdBy ? ` by ${editForm.createdBy}` : ''}</span>
              <span>Updated: {formatDate(editForm.updatedAt)}{editForm.updatedBy ? ` by ${editForm.updatedBy}` : ''}</span>
            </div>
          )}
          <div className={`flex gap-2 ${mode === 'create' ? 'sm:ml-auto' : ''}`}>
          {readonly ? (
            <>
              {onEdit && (
                <Button onClick={onEdit} className="bg-indigo-600 hover:bg-indigo-700">
                  Edit
                </Button>
              )}
              <Button variant="secondary" onClick={onCancel}>
                Close
              </Button>
            </>
          ) : (
            <>
              <Button onClick={onSave} disabled={loading} className="bg-indigo-600 hover:bg-indigo-700">
                {loading ? 'Saving...' : 'Save'}
              </Button>
              <Button variant="secondary" onClick={onCancel} disabled={loading}>
                Cancel
              </Button>
            </>
          )}
          </div>
        </div>
      </div>
    </div>
  );
}
