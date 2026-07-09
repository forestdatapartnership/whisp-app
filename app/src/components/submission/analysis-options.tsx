'use client'

import { useState } from 'react'
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

const COUNTRIES = [
  { code: 'cm', label: 'Cameroon' },
  { code: 'co', label: 'Colombia' },
  { code: 'ci', label: "Côte d'Ivoire" },
  { code: 'br', label: 'Brazil' },
]

interface AnalysisOptionsProps {
  value: AnalysisOptionsValue
  onChange: (value: AnalysisOptionsValue) => void
  disabled?: boolean
}

export function AnalysisOptions({ value, onChange, disabled = false }: AnalysisOptionsProps) {
  const [open, setOpen] = useState(false)

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div className={`border border-border ${controlRounded} bg-surface overflow-hidden`}>
        <CollapsibleTrigger className="w-full flex items-center justify-between px-4 py-3.5 text-text-muted hover:text-text-primary transition-colors cursor-pointer">
          <span className="flex items-center gap-2 text-[13px] font-medium">
            <SlidersHorizontal className="size-3.5" />
            Analysis options
          </span>
          <ChevronDown className={cn('size-3.5 transition-transform', open && 'rotate-180')} />
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="border-t border-border p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex flex-col gap-1.5">
                <Label>Additional Country Data</Label>
                <MultiSelect
                  options={COUNTRIES.map((c) => ({ value: c.code, label: c.label }))}
                  value={value.nationalCodes}
                  onChange={(codes) => onChange({ ...value, nationalCodes: codes })}
                  disabled={disabled}
                  placeholder="No countries"
                  className="w-full"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label>Units</Label>
                <Select
                  value={value.unitType}
                  onValueChange={(v) => onChange({ ...value, unitType: v as UnitType })}
                  disabled={disabled}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ha">Hectares</SelectItem>
                    <SelectItem value="percent">Percent</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label>External ID Column</Label>
                <Input
                  type="text"
                  placeholder="Enter column name"
                  value={value.externalIdColumn ?? ''}
                  onChange={(e) => onChange({ ...value, externalIdColumn: e.target.value })}
                  disabled={disabled}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <div className="flex items-center gap-1.5">
                  <Label>Geometry Audit Trail</Label>
                  <Tooltip>
                    <TooltipTrigger
                      render={(props) => (
                        <button type="button" {...props} className="text-text-muted hover:text-text-primary transition-colors">
                          <Info className="size-3.5" />
                        </button>
                      )}
                    />
                    <TooltipContent className="max-w-xs text-left leading-relaxed">
                      Geospatial data may be modified slightly during the analysis in Google Earth Engine, especially notable for very small polygons. We return the modified output for transparency in what was analysed, but if you require your input data to be returned you can select this option and it will add an extra column called &lsquo;geo_original&rsquo;.
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
