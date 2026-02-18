'use client';

import { FormField } from '@/components/ui/FormField';
import { CollapsibleSection } from '@/components/ui/CollapsibleSection';
import type { AnalysisMetadata } from '@/types/models';

const ANALYSIS_METADATA_TYPES = ['string', 'int32', 'int64', 'float32', 'float64', 'bool', 'object'] as const;

interface AnalysisMetadataSectionProps {
  value?: AnalysisMetadata | null;
  readonly?: boolean;
  onChange?: (value: AnalysisMetadata) => void;
}

export function AnalysisMetadataSection({ value, readonly, onChange }: AnalysisMetadataSectionProps) {
  const hasContent = value && (
    value.type || value.excludeFromOutput != null || value.isNullable != null ||
    value.isRequired != null || value.correspondingVariable || (value.geeAssets && value.geeAssets.length > 0)
  );

  const geeAssetsStr = value?.geeAssets?.join('\n') ?? '';

  return (
    <CollapsibleSection id="section-analysis" title="Analysis metadata" defaultOpen={!!hasContent} className="scroll-mt-24">
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormField
            kind="select"
            label="Type (Python)"
            value={value?.type ?? ''}
            readonly={readonly}
            options={[...ANALYSIS_METADATA_TYPES]}
            placeholder="Select type"
            onChange={(v) => onChange?.({ ...value, type: String(v || '') || undefined })}
            className="h-8 text-sm bg-gray-700 border-gray-600"
          />
          <FormField
            label="Corresponding variable"
            value={value?.correspondingVariable ?? ''}
            readonly={readonly}
            placeholder="Corresponding variable"
            onChange={(v) => onChange?.({ ...value, correspondingVariable: String(v || '') || undefined })}
            className="h-8 text-sm bg-gray-700 border-gray-600"
          />
          <div />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormField
            kind="checkbox"
            label="Exclude from output"
            value={value?.excludeFromOutput}
            triState
            readonly={readonly}
            onChange={(v) => onChange?.({ ...value, excludeFromOutput: v })}
          />
          <FormField
            kind="checkbox"
            label="Is nullable"
            value={value?.isNullable}
            triState
            readonly={readonly}
            onChange={(v) => onChange?.({ ...value, isNullable: v })}
          />
          <FormField
            kind="checkbox"
            label="Is required"
            value={value?.isRequired}
            triState
            readonly={readonly}
            onChange={(v) => onChange?.({ ...value, isRequired: v })}
          />
        </div>
        <FormField
          kind="textarea"
          label="GEE assets (one per line)"
          value={geeAssetsStr}
          readonly={readonly}
          placeholder="One asset ID per line"
          rows={4}
          onChange={(v) => onChange?.({ ...value, geeAssets: v ? String(v).split(/\r?\n/).map(s => s.trim()).filter(Boolean) : undefined })}
          className="text-sm bg-gray-700 border-gray-600"
        />
      </div>
    </CollapsibleSection>
  );
}
