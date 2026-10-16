'use client'

import { useMemo, useState } from 'react'
import { useTranslations } from 'next-intl'
import { MapPin } from 'lucide-react'
import { cn } from '@/lib/utils'
import { controlFocus } from '@/components/ui/styles'
import { ZoneContent, zoneAccent, zoneClassName } from '@/components/ui/zone'
import { useConfig } from '@/lib/config/config-context'
import { DEFAULT_MAX_MAP_FEATURES, parseFeatures, type SourceFeature } from '@/lib/draw/geojson'
import { DrawDialog } from './draw-dialog'

interface MapDrawInputProps {
  value: string
  onChange: (value: string) => void
}

export function MapDrawInput({ value, onChange }: MapDrawInputProps) {
  const t = useTranslations('Submission')
  const { config } = useConfig()
  const features = useMemo(() => parseFeatures(value), [value])
  const [editing, setEditing] = useState<SourceFeature[] | null>(null)
  const count = features?.length ?? 0
  const maxFeatures = config?.map.maxFeatures ?? DEFAULT_MAX_MAP_FEATURES

  const hint = () => {
    if (!features) return t('draw.mapInvalid')
    if (count > maxFeatures) return t('draw.mapTooMany', { max: maxFeatures })
    return count > 0 ? t('draw.mapEdit') : t('draw.mapEmpty')
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setEditing(features)}
        disabled={!features || count > maxFeatures}
        className={cn(controlFocus, zoneClassName({ filled: count > 0, layout: 'row' }), 'disabled:pointer-events-none disabled:opacity-50')}
      >
        <ZoneContent
          icon={MapPin}
          prompt={t.rich('draw.mapPrompt', { accent: zoneAccent })}
          badge={count > 0 ? t('draw.features', { count }) : undefined}
          hint={hint()}
          layout="row"
        />
      </button>

      {editing && (
        <DrawDialog
          features={editing}
          maxPlotAreaHa={config?.submission.maxPlotAreaHa}
          onConfirm={(geojson) => {
            onChange(geojson)
            setEditing(null)
          }}
          onClose={() => setEditing(null)}
        />
      )}
    </>
  )
}
