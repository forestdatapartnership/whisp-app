'use client';

import { FormField } from '@/components/ui/FormField';
import { CollapsibleSection } from '@/components/ui/CollapsibleSection';
import type { PowerBiMetadata } from '@/types/models';

interface PowerBiMetadataSectionProps {
  value?: PowerBiMetadata | null;
  readonly?: boolean;
  onChange?: (value: PowerBiMetadata) => void;
}

export function PowerBiMetadataSection({ value, readonly, onChange }: PowerBiMetadataSectionProps) {
  const hasContent = value && value.dashboard != null;

  return (
    <CollapsibleSection id="section-powerbi" title="Power BI metadata" defaultOpen={!!hasContent} className="scroll-mt-24">
      <FormField
        kind="checkbox"
        label="Dashboard"
        value={value?.dashboard}
        triState
        readonly={readonly}
        onChange={(v) => onChange?.({ ...value, dashboard: v })}
      />
    </CollapsibleSection>
  );
}
