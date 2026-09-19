'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { SlidersHorizontal, ChevronDown, Info } from 'lucide-react'
import { cn } from '@/lib/utils'
import { controlRounded } from '@/components/ui/styles'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { MultiSelect } from '@/components/ui/multi-select'
import { Switch } from '@/components/ui/switch'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'

export type UnitType = 'ha' | 'percent'

export interface AnalysisOptionsValue {
  externalIdColumn?: string
  nationalCodes: string[]
  unitType: UnitType
  async: boolean
  geometryAuditTrail: boolean
}

export const DEFAULT_ANALYSIS_OPTIONS: AnalysisOptionsValue = {
  externalIdColumn: '',
  nationalCodes: ['cm', 'co', 'ci', 'br'],
  unitType: 'ha',
  async: true,
  geometryAuditTrail: false,
}

const COUNTRY_CODES = ['cm', 'co', 'ci', 'br'] as const
const UNIT_OPTIONS: UnitType[] = ['ha', 'percent']

interface AnalysisOptionsProps {
  value: AnalysisOptionsValue
  onChange: (value: AnalysisOptionsValue) => void
  disabled?: boolean
}

export function AnalysisOptions({ value, onChange, disabled = false }: AnalysisOptionsProps) {
  const t = useTranslations('AnalysisOptions')
  const [open, setOpen] = useState(false)
  const unitItems = UNIT_OPTIONS.map((unit) => ({ value: unit, label: t(`unit.${unit}`) }))

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div className={`border border-border ${controlRounded} bg-surface overflow-hidden`}>
        <CollapsibleTrigger className="w-full flex items-center justify-between px-4 py-3.5 text-text-muted hover:text-text-primary transition-colors cursor-pointer">
          <span className="flex items-center gap-2 text-[13px] font-medium">
            <SlidersHorizontal className="size-3.5" />
            {t('title')}
          </span>
          <ChevronDown className={cn('size-3.5 transition-transform', open && 'rotate-180')} />
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="border-t border-border p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex flex-col gap-1.5">
                <Label>{t('countries')}</Label>
                <MultiSelect
                  options={COUNTRY_CODES.map((code) => ({ value: code, label: t(`country.${code}`) }))}
                  value={value.nationalCodes}
                  onChange={(codes) => onChange({ ...value, nationalCodes: codes })}
                  disabled={disabled}
                  placeholder={t('noCountries')}
                  className="w-full"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label>{t('units')}</Label>
                <Select
                  items={unitItems}
                  value={value.unitType}
                  onValueChange={(v) => onChange({ ...value, unitType: v as UnitType })}
                  disabled={disabled}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {unitItems.map((unit) => (
                      <SelectItem key={unit.value} value={unit.value}>{unit.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label>{t('externalId')}</Label>
                <Input
                  type="text"
                  placeholder={t('externalIdPlaceholder')}
                  value={value.externalIdColumn ?? ''}
                  onChange={(e) => onChange({ ...value, externalIdColumn: e.target.value })}
                  disabled={disabled}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <div className="flex items-center gap-1.5">
                  <Label>{t('auditTrail')}</Label>
                  <Tooltip>
                    <TooltipTrigger
                      render={(props) => (
                        <button type="button" {...props} className="text-text-muted hover:text-text-primary transition-colors">
                          <Info className="size-3.5" />
                        </button>
                      )}
                    />
                    <TooltipContent className="max-w-xs text-justify leading-relaxed">
                      {t('auditTrailHelp')}
                    </TooltipContent>
                  </Tooltip>
                </div>
                <div className="flex items-center h-9">
                  <Switch
                    checked={value.geometryAuditTrail}
                    onCheckedChange={(checked) => onChange({ ...value, geometryAuditTrail: !!checked })}
                    disabled={disabled}
                  />
                </div>
              </div>
            </div>
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  )
}
