'use client';

import { FormField } from '@/components/ui/FormField';
import { CollapsibleSection } from '@/components/ui/CollapsibleSection';
import { formatColumnName } from '@/lib/utils/formatColumnName';
import type { DisplayMetadata } from '@/types/models';

interface DisplayMetadataSectionProps {
  value?: DisplayMetadata | null;
  code?: string;
  readonly?: boolean;
  onChange?: (value: DisplayMetadata) => void;
}

export function DisplayMetadataSection({ value, code, readonly, onChange }: DisplayMetadataSectionProps) {
  const hasContent = value && (value.displayName || value.excludeFromResults != null || value.visibleByDefault != null);
  const displayNamePlaceholder = code ? `Empty = ${formatColumnName(code)}` : undefined;

  return (
    <CollapsibleSection id="section-display" title="Display metadata" defaultOpen={!!hasContent} className="scroll-mt-24">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <FormField
          label="Display name override"
          value={value?.displayName ?? ''}
          readonly={readonly}
          placeholder={displayNamePlaceholder}
          onChange={(v) => onChange?.({ ...value, displayName: String(v || '') || undefined })}
          className="h-8 text-sm bg-gray-700 border-gray-600"
        />
        <FormField
          kind="checkbox"
          label="Exclude from results"
          value={value?.excludeFromResults}
          triState
          readonly={readonly}
          onChange={(v) => onChange?.({ ...value, excludeFromResults: v })}
        />
        <FormField
          kind="checkbox"
          label="Visible by default"
          value={value?.visibleByDefault}
          triState
          readonly={readonly}
          onChange={(v) => onChange?.({ ...value, visibleByDefault: v })}
        />
      </div>
    </CollapsibleSection>
  );
}
