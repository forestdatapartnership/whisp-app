'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslations } from 'next-intl'
import { AlertTriangle } from 'lucide-react'
import { parseGeometryText, readGeometryFile } from '@/lib/utils/file-parser'
import { parseFeatures } from '@/lib/draw/geojson'
import { geometryAreaHa } from '@/lib/draw/geometry'
import { useSubmitAnalysis } from '@/lib/submission/useSubmitAnalysis'
import { SubmitActions } from './submit-actions'
import { FileTextInput } from './file-text-input'
import { MapDrawInput } from './draw/map-draw-input'
import { AnalysisOptions, AnalysisOptionsValue, DEFAULT_ANALYSIS_OPTIONS } from './analysis-options'

interface SubmitGeometryProps {
  maxFileSize?: number
  geometryLimit?: number
  maxPlotAreaHa?: number
  asyncThreshold?: number
  onError: (msg: string) => void
  initialFile?: File | null
}

export function SubmitGeometry({
  maxFileSize,
  geometryLimit,
  maxPlotAreaHa,
  asyncThreshold = 50,
  onError,
  initialFile,
}: SubmitGeometryProps) {
  const t = useTranslations('Submission')
  const [text, setText] = useState('')
  const [analysisOptions, setAnalysisOptions] = useState<AnalysisOptionsValue>(DEFAULT_ANALYSIS_OPTIONS)
  const parsed = useMemo(() => parseGeometryText(text), [text])
  const appliedFileRef = useRef<File | null>(null)

  const { submit, isLoading, error: submitError } = useSubmitAnalysis({
    analysisOptions,
    featureCount: 'error' in parsed ? 0 : parsed.featureCount,
    asyncThreshold,
  })

  useEffect(() => {
    if (submitError) onError(submitError)
  }, [submitError, onError])

  useEffect(() => {
    if (!initialFile || appliedFileRef.current === initialFile) return
    appliedFileRef.current = initialFile
    if (maxFileSize && initialFile.size > maxFileSize) {
      onError(t('fileTooLarge', { maxKb: maxFileSize / 1024 }))
      return
    }
    void readGeometryFile(initialFile).then((result) => {
      if (typeof result === 'string') setText(result)
      else onError(t(`fileErrors.${result.error}`))
    })
  }, [initialFile, maxFileSize, onError, t])

  const reset = () => {
    setText('')
    onError('')
  }

  const handleAnalyze = () => {
    if ('error' in parsed) {
      onError(t(`fileErrors.${parsed.error}`))
      return
    }
    if (geometryLimit && parsed.featureCount > geometryLimit) {
      onError(t('tooManyGeometries', { limit: geometryLimit }))
      return
    }
    if (maxPlotAreaHa != null && parseFeatures(text)?.some((feature) => geometryAreaHa(feature.geometry) > maxPlotAreaHa)) {
      onError(t('draw.tooLarge', { limit: maxPlotAreaHa }))
      return
    }
    submit({
      type: 'geometry',
      payload: 'wkt' in parsed ? { type: 'wkt', wkt: parsed.wkt } : { type: 'json', geojson: parsed.json },
    })
  }

  const downloadExample = () => {
    const a = document.createElement('a')
    a.href = '/whisp_example_polys.geojson'
    a.download = 'whisp_example_polys.geojson'
    a.click()
  }

  return (
    <div className="flex flex-col gap-3">
      <FileTextInput
        accept=".txt,.json,.geojson"
        formats=".txt · .json · .geojson"
        placeholder={t('geometryPlaceholder')}
        value={text}
        onChange={setText}
        readFile={readGeometryFile}
        maxFileSize={maxFileSize}
        onError={onError}
      >
        <MapDrawInput value={text} onChange={setText} />
      </FileTextInput>
      <div className="flex items-start gap-2 text-[12px] text-text-muted leading-relaxed">
        <AlertTriangle className="size-3.5 flex-shrink-0 mt-0.5 text-risk-medium" />
        {t('geometryHint')} {t('draw.hint')}
      </div>
      <AnalysisOptions value={analysisOptions} onChange={setAnalysisOptions} />
      <SubmitActions
        downloadVisible
        downloadLabel={t('example')}
        onDownload={downloadExample}
        onClear={reset}
        runLabel={t('run')}
        onRun={handleAnalyze}
        runDisabled={!text.trim()}
        isLoading={isLoading}
      />
    </div>
  )
}
