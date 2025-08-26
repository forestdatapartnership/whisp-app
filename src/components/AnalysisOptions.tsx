'use client'
import React from 'react'
import { Button } from '@/components/ui/Button'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/Collapsible'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioItem,
  DropdownMenuRadioGroup,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/DropdownMenu'

import { ChevronDown, SlidersHorizontal } from 'lucide-react'

export type UnitType = 'ha' | 'percent'

export interface AnalysisOptionsValue {
  externalIdColumn?: string
  nationalCodes: string[]
  unitType: UnitType
  async: boolean
}

export const DEFAULT_ANALYSIS_OPTIONS: AnalysisOptionsValue = {
  externalIdColumn: '',
  nationalCodes: ['co', 'ci', 'br'],
  unitType: 'ha',
  async: true,
}

interface AnalysisOptionsProps {
  value: AnalysisOptionsValue
  onChange: (value: AnalysisOptionsValue) => void
  disabled?: boolean
}

const COUNTRIES = [
  { code: 'co', label: 'Colombia' },
  { code: 'ci', label: "Côte d’Ivoire" },
  { code: 'br', label: 'Brazil' }
]

export default function AnalysisOptions({ value, onChange, disabled = false }: AnalysisOptionsProps) {
  const [open, setOpen] = React.useState(false)
  const toggleCountry = (code: string) => {
    const has = value.nationalCodes.includes(code)
    const next = has ? value.nationalCodes.filter(c => c !== code) : [...value.nationalCodes, code]
    onChange({ ...value, nationalCodes: next })
  }

  const unitLabel = value.unitType === 'ha' ? 'Hectares' : 'Percent'
  const countriesLabel = (() => {
    if (value.nationalCodes.length === COUNTRIES.length) return 'All countries'
    if (value.nationalCodes.length === 0) return 'No countries'
    return COUNTRIES.filter(c => value.nationalCodes.includes(c.code)).map(c => c.label).join(', ')
  })()

  const selectAllCountries = () => onChange({ ...value, nationalCodes: COUNTRIES.map(c => c.code) })
  const selectNoneCountries = () => onChange({ ...value, nationalCodes: [] })

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div className="border border-gray-300 bg-gray-800 rounded">
        <CollapsibleTrigger asChild>
          <Button variant="ghost" size="sm" className="w-full justify-between">
            <span className="flex items-center gap-2 text-sm font-medium">
              <SlidersHorizontal className="h-4 w-4" />
              Analysis options
            </span>
            <ChevronDown className={`h-4 w-4 transition-transform ${open ? 'rotate-180' : ''}`} />
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="p-3 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" disabled={disabled} className="w-full justify-center">
                    <span className="font-medium">Country Data:</span>
                    <span className="ml-2 font-normal">{countriesLabel}</span>
                  </Button>
                </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-64" onCloseAutoFocus={(e) => e.preventDefault()}>
                    <div className="flex items-center space-x-2 px-1 py-1">
                      <Button variant="outline" size="sm" onClick={selectNoneCountries}>Select None</Button>
                      <Button variant="outline" size="sm" onClick={selectAllCountries}>Select All</Button>
                      <div className="flex-1 text-sm text-muted-foreground" />
                    </div>
                    <DropdownMenuSeparator />
                  {COUNTRIES.map((c) => (
                    <DropdownMenuCheckboxItem
                      key={c.code}
                      checked={value.nationalCodes.includes(c.code)}
                      onCheckedChange={() => toggleCountry(c.code)}
                        onSelect={(e) => e.preventDefault()}
                    >
                      {c.label}
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" disabled={disabled} className="w-full justify-center">
                    <span className="font-medium">Units:</span>
                    <span className="ml-2 font-normal">{unitLabel}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-64">
                  <DropdownMenuLabel>Select unit</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuRadioGroup
                    value={value.unitType}
                    onValueChange={(v) => onChange({ ...value, unitType: v as UnitType })}
                  >
                    <DropdownMenuRadioItem value="ha">Hectares</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="percent">Percent</DropdownMenuRadioItem>
                  </DropdownMenuRadioGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  )
}


