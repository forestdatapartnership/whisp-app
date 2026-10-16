'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { AlertTriangle } from 'lucide-react'
import { parseGeoIdText, readGeoIdFile } from '@/lib/utils/file-parser'
import { useSubmitAnalysis } from '@/lib/submission/useSubmitAnalysis'
import { SubmitActions } from './submit-actions'
import { FileTextInput } from './file-text-input'
import { AnalysisOptions, AnalysisOptionsValue, DEFAULT_ANALYSIS_OPTIONS } from './analysis-options'

interface SubmitGeoIdsProps {
  maxFileSize?: number
  geometryLimit?: number
  asyncThreshold?: number
  onError: (msg: string) => void
}

export function SubmitGeoIds({
  maxFileSize,
  geometryLimit,
  asyncThreshold = 50,
  onError,
}: SubmitGeoIdsProps) {
  const t = useTranslations('Submission')
  const [geoIdText, setGeoIdText] = useState('')
  const [analysisOptions, setAnalysisOptions] = useState<AnalysisOptionsValue>(DEFAULT_ANALYSIS_OPTIONS)

  const cleanIds = parseGeoIdText(geoIdText)
  const featureCount = cleanIds.length

  const { submit, isLoading, error: submitError } = useSubmitAnalysis({
    analysisOptions,
    featureCount,
    asyncThreshold,
  })

  useEffect(() => {
    if (submitError) onError(submitError)
  }, [submitError, onError])

  const reset = () => {
    setGeoIdText('')
    onError('')
  }

  const handleAnalyze = () => {
    if (cleanIds.length === 0) {
      onError(t('geoIdsRequired'))
      return
    }
    if (geometryLimit && cleanIds.length > geometryLimit) {
      onError(t('tooManyGeoIds', { limit: geometryLimit }))
      return
    }
    submit({ type: 'geo-ids', geoIds: cleanIds })
  }

  const downloadExample = () => {
    const a = document.createElement('a')
    a.href = '/geoids.txt'
    a.download = 'geoids.txt'
    a.click()
  }

  return (
    <div className="flex flex-col gap-3">
      <FileTextInput
        accept=".txt"
        formats={t('txtFile')}
        placeholder={t('geoIdsPlaceholder')}
        value={geoIdText}
        onChange={setGeoIdText}
        readFile={readGeoIdFile}
        maxFileSize={maxFileSize}
        onError={onError}
      />

      <div className="flex items-start gap-2 text-[12px] text-text-muted leading-relaxed">
        <AlertTriangle className="size-3.5 flex-shrink-0 mt-0.5 text-risk-medium" />
        {t('geoIdsHint')}
      </div>

      <AnalysisOptions value={analysisOptions} onChange={setAnalysisOptions} />

      <SubmitActions
        downloadVisible
        downloadLabel={t('example')}
        onDownload={downloadExample}
        onClear={reset}
        runLabel={t('run')}
        onRun={handleAnalyze}
        runDisabled={cleanIds.length === 0}
        isLoading={isLoading}
      />
    </div>
  )
}
