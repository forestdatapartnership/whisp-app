'use client'

import { useEffect, useState } from 'react'
import { useFormatter, useTranslations } from 'next-intl'
import { Download, Trash2, Play, Loader2, AlertTriangle, MapPin } from 'lucide-react'
import { cn } from '@/lib/utils'
import { controlFocus, controlRounded } from '@/components/ui/styles'
import { useSubmitAnalysis } from '@/lib/submission/useSubmitAnalysis'
import { isValidPlot, ringAreaHa, selfIntersects, toFeatureCollection } from '@/lib/draw/geometry'
import { downloadPlot } from '@/lib/draw/download'
import type { Vertex } from '@/lib/draw/use-vertices'
import { Button } from '@/components/ui/button'
import { AnalysisOptions, AnalysisOptionsValue, DEFAULT_ANALYSIS_OPTIONS } from './analysis-options'
import { DrawDialog } from './draw/draw-dialog'

interface DrawPlotProps {
  maxPlotAreaHa?: number
  onError: (msg: string) => void
}

export function DrawPlot({ maxPlotAreaHa, onError }: DrawPlotProps) {
  const t = useTranslations('Submission')
  const tCommon = useTranslations('Common')
  const format = useFormatter()
  const [vertices, setVertices] = useState<Vertex[]>([])
  const [open, setOpen] = useState(false)
  const [analysisOptions, setAnalysisOptions] = useState<AnalysisOptionsValue>(DEFAULT_ANALYSIS_OPTIONS)

  const areaHa = ringAreaHa(vertices)
  const valid = isValidPlot(vertices.length, selfIntersects(vertices), areaHa)

  const { submit, isLoading, error: submitError } = useSubmitAnalysis({
    analysisOptions,
    featureCount: 1,
    agent: 'ui:draw',
  })

  useEffect(() => {
    if (submitError) onError(submitError)
  }, [submitError, onError])

  const reset = () => {
    setVertices([])
    onError('')
  }

  const handleAnalyze = () => {
    const geojson = toFeatureCollection(vertices)
    if (!geojson) {
      onError(t('draw.required'))
      return
    }
    submit({ type: 'geometry', payload: { type: 'json', geojson } })
  }

  const summary =
    vertices.length === 1
      ? t('draw.singlePoint')
      : t('draw.summary', {
          points: vertices.length,
          area: format.number(areaHa, { maximumFractionDigits: 2 }),
        })

  return (
    <div className="flex flex-col gap-3">
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          `${controlFocus} flex h-40 cursor-pointer flex-col items-center justify-center gap-2 border-[1.5px] border-dashed p-8 transition-colors`,
          valid
            ? 'border-accent-green-dim bg-accent-green/[0.06]'
            : 'border-border bg-surface hover:border-accent-green hover:bg-accent-green/[0.04]'
        )}
      >
        <div
          className={cn(
            `mb-1 flex size-10 items-center justify-center ${controlRounded}`,
            valid ? 'bg-accent-green/20 text-accent-green' : 'bg-surface-raised text-text-muted'
          )}
        >
          <MapPin className="size-5" />
        </div>
        {valid ? (
          <>
            <span className="rounded-full bg-accent-green/10 px-2.5 py-0.5 text-[12px] font-medium text-accent-green">
              {summary}
            </span>
            <span className="text-[12px] text-text-muted">{t('draw.edit')}</span>
          </>
        ) : (
          <>
            <span className="text-[14px] font-medium text-text-primary">{t('draw.openMap')}</span>
            <span className="text-center text-[12px] text-text-muted">{t('draw.intro')}</span>
          </>
        )}
      </button>

      <div className="flex items-start gap-2 text-[12px] leading-relaxed text-text-muted">
        <AlertTriangle className="mt-0.5 size-3.5 flex-shrink-0 text-risk-medium" />
        {t('draw.hint')}
      </div>

      <AnalysisOptions value={analysisOptions} onChange={setAnalysisOptions} />

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <Button type="button" variant="outline" className="w-full sm:w-auto" onClick={() => downloadPlot(vertices)} disabled={!valid}>
          <Download className="size-3.5" />
          {t('draw.download')}
        </Button>
        <Button type="button" variant="outline" className="w-full sm:w-auto" onClick={reset} disabled={!valid}>
          <Trash2 className="size-3.5" />
          {tCommon('clear')}
        </Button>
        <Button type="button" className="w-full sm:flex-1" disabled={isLoading || !valid} onClick={handleAnalyze}>
          {isLoading ? <Loader2 className="size-4 animate-spin" /> : <Play className="size-4" />}
          {isLoading ? t('running') : t('run')}
        </Button>
      </div>

      {open && (
        <DrawDialog
          initialVertices={vertices}
          maxPlotAreaHa={maxPlotAreaHa}
          onConfirm={(next) => {
            setVertices(next)
            setOpen(false)
            onError('')
          }}
          onClose={() => setOpen(false)}
        />
      )}
    </div>
  )
}
