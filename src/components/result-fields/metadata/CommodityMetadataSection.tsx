'use client';

import { FormField } from '@/components/ui/FormField';
import { CollapsibleSection } from '@/components/ui/CollapsibleSection';
import { useResultFields } from '@/lib/contexts/ResultFieldsContext';
import type { CommodityMetadata, CommodityMetadataMap } from '@/types/models';

interface CommodityMetadataSectionProps {
  value?: CommodityMetadataMap | null;
  readonly?: boolean;
  onChange?: (value: CommodityMetadataMap) => void;
}

function updateMetadataForCommodity(
  current: CommodityMetadataMap | null | undefined,
  commodityCode: string,
  updates: Partial<CommodityMetadata>
): CommodityMetadataMap {
  const existing = current?.[commodityCode] ?? {};
  const merged = { ...existing, ...updates };
  const hasValues = merged.usedForRisk != null || (merged.dataTheme != null && merged.dataTheme !== '');
  const next = { ...(current ?? {}) };
  if (hasValues) {
    next[commodityCode] = merged;
  } else {
    delete next[commodityCode];
  }
  return next;
}

export function CommodityMetadataSection({ value, readonly, onChange }: CommodityMetadataSectionProps) {
  const { commodities } = useResultFields();
  const sortedCommodities = [...commodities].sort((a, b) => a.code.localeCompare(b.code));
  const hasContent = value && Object.keys(value).length > 0;

  return (
    <CollapsibleSection id="section-commodity" title="Commodity metadata" defaultOpen={!!hasContent} className="scroll-mt-24">
      <div className="space-y-4">
        {sortedCommodities.length === 0 ? (
          <p className="text-sm text-gray-400">No commodities defined. Add commodities in Reference → Commodities.</p>
        ) : (
          <div className="space-y-4">
            {sortedCommodities.map((commodity) => {
              const meta = value?.[commodity.code] ?? {};
              const label = commodity.description ? `${commodity.code} — ${commodity.description}` : commodity.code;
              return (
                <div
                  key={commodity.code}
                  className="rounded-md border border-gray-600 bg-gray-800/50 p-4 space-y-3"
                >
                  <h4 className="text-sm font-medium text-gray-300">{label}</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField
                      kind="checkbox"
                      label="Used for risk"
                      value={meta.usedForRisk}
                      triState
                      readonly={readonly}
                      onChange={(v) => onChange?.(updateMetadataForCommodity(value, commodity.code, { ...meta, usedForRisk: v }))}
                    />
                    <FormField
                      kind="input"
                      label="Data theme"
                      value={meta.dataTheme ?? ''}
                      readonly={readonly}
                      placeholder="e.g. deforestation"
                      onChange={(v) => onChange?.(updateMetadataForCommodity(value, commodity.code, { ...meta, dataTheme: String(v) }))}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </CollapsibleSection>
  );
}
