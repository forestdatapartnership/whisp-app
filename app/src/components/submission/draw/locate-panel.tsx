'use client'

import { useState, type FormEvent } from 'react'
import { useTranslations } from 'next-intl'
import { LocateFixed, Loader2, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { parseLatLng, type LatLng } from '@/lib/draw/geometry'

interface LocatePanelProps {
  ready: boolean
  locating: boolean
  failed: boolean
  onLocate: () => void
  onGoTo: (point: LatLng) => void
}

export function LocatePanel({ ready, locating, failed, onLocate, onGoTo }: LocatePanelProps) {
  const t = useTranslations('Submission')
  const [coords, setCoords] = useState('')
  const [invalid, setInvalid] = useState(false)

  const goToCoords = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const point = parseLatLng(coords)
    if (!point) {
      setInvalid(true)
      return
    }
    onGoTo(point)
  }

  return (
    <div className="flex shrink-0 flex-col gap-2 border-b border-border bg-surface px-4 py-2.5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <Button type="button" variant="outline" onClick={onLocate} disabled={!ready || locating} className="w-full sm:w-auto">
          {locating ? <Loader2 className="size-4 animate-spin" /> : <LocateFixed className="size-4" />}
          {locating ? t('draw.locating') : t('draw.locate')}
        </Button>

        <form className="flex min-w-0 flex-1 items-center gap-2" onSubmit={goToCoords}>
          <label htmlFor="draw-coordinates" className="sr-only">{t('draw.coordsLabel')}</label>
          <Input
            id="draw-coordinates"
            value={coords}
            onChange={(e) => { setCoords(e.target.value); setInvalid(false) }}
            placeholder={t('draw.coordsPlaceholder')}
            aria-invalid={invalid}
            aria-describedby={invalid ? 'draw-coordinates-error' : undefined}
            disabled={!ready}
            spellCheck={false}
            className="min-w-0 flex-1 font-mono text-[12px]"
          />
          <Button type="submit" variant="outline" size="icon" disabled={!ready} aria-label={t('draw.go')}>
            <ArrowRight className="size-4" />
          </Button>
        </form>
      </div>

      {(invalid || failed) && (
        <p id={invalid ? 'draw-coordinates-error' : undefined} role="alert" className="text-[12px] text-destructive">
          {invalid ? t('draw.coordsInvalid') : t('draw.locateFailed')}
        </p>
      )}
    </div>
  )
}
