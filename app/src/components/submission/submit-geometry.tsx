'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useTranslations } from 'next-intl'
import { AlertTriangle } from 'lucide-react'
import { parseGeometryFile } from '@/lib/utils/file-parser'
import type { GeoPayload } from '@/lib/submission/useSubmitAnalysis'
import { useSubmitAnalysis } from '@/lib/submission/useSubmitAnalysis'
import { SubmitActions } from './submit-actions'
import { FileDropZone } from './file-drop-zone'
import { AnalysisOptions, AnalysisOptionsValue, DEFAULT_ANALYSIS_OPTIONS } from './analysis-options'

interface SubmitGeometryProps {
  maxFileSize?: number
  geometryLimit?: number
  asyncThreshold?: number
  onError: (msg: string) => void
  initialFile?: File | null
}

export function SubmitGeometry({
  maxFileSize,
  geometryLimit,
  asyncThreshold = 50,
  onError,
  initialFile,
}: SubmitGeometryProps) {
  const t = useTranslations('Submission')
  const [fileName, setFileName] = useState('')
  const [featureCount, setFeatureCount] = useState(0)
  const [payload, setPayload] = useState<GeoPayload | null>(null)
  const [analysisOptions, setAnalysisOptions] = useState<AnalysisOptionsValue>(DEFAULT_ANALYSIS_OPTIONS)

  const appliedFileRef = useRef<File | null>(null)

  const { submit, isLoading, error: submitError } = useSubmitAnalysis({
    analysisOptions,
    featureCount,
    asyncThreshold,
    agent: 'ui:geojson',
  })

  useEffect(() => {
    if (submitError) onError(submitError)
  }, [submitError, onError])

  const clearFile = () => {
    setFileName('')
    setPayload(null)
    setFeatureCount(0)
  }

  const reset = () => {
    clearFile()
    onError('')
  }

  const handleFile = useCallback(async (file: File) => {
    onError('')
    if (maxFileSize && file.size > maxFileSize) {
      onError(t('fileTooLarge', { maxKb: maxFileSize / 1024 }))
      clearFile()
      return
    }

    const result = await parseGeometryFile(file)
    if ('error' in result) {
      onError(t(`fileErrors.${result.error}`))
      clearFile()
      return
    }

    if (geometryLimit && result.featureCount > geometryLimit) {
      onError(t('tooManyGeometries', { limit: geometryLimit }))
      clearFile()
      return
    }

    setFileName(file.name)
    setFeatureCount(result.featureCount)
    setPayload('wkt' in result ? { type: 'wkt', wkt: result.wkt } : { type: 'json', geojson: result.json })
  }, [maxFileSize, geometryLimit, onError, t])

  useEffect(() => {
    if (!initialFile || appliedFileRef.current === initialFile) return
    appliedFileRef.current = initialFile
    void handleFile(initialFile)
  }, [initialFile, handleFile])

  const handleAnalyze = () => {
    if (!payload) {
      onError(t('geometryRequired'))
      return
    }
    submit({ type: 'geometry', payload })
  }

  const downloadExample = () => {
    const a = document.createElement('a')
    a.href = '/whisp_example_polys.geojson'
    a.download = 'whisp_example_polys.geojson'
    a.click()
  }

  return (
    <div className="flex flex-col gap-3">
      <FileDropZone
        accept=".txt,.json,.geojson"
        fileName={fileName}
        onFile={handleFile}
        formats=".txt · .json · .geojson"
      />
      <div className="flex items-start gap-2 text-[12px] text-text-muted leading-relaxed">
        <AlertTriangle className="size-3.5 flex-shrink-0 mt-0.5 text-risk-medium" />
        {t('geometryHint')}
      </div>
      <AnalysisOptions value={analysisOptions} onChange={setAnalysisOptions} />
      <SubmitActions
        downloadVisible
        downloadLabel={t('example')}
        onDownload={downloadExample}
        onClear={reset}
        runLabel={t('run')}
        onRun={handleAnalyze}
        runDisabled={!payload}
        isLoading={isLoading}
      />
    </div>
  )
}
