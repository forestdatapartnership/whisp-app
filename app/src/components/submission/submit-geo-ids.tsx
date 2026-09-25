'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { AlertTriangle } from 'lucide-react'
import { parseGeoIdText, parseGeoIdFile } from '@/lib/utils/file-parser'
import { useSubmitAnalysis } from '@/lib/submission/useSubmitAnalysis'
import { SubmitActions } from './submit-actions'
import { Textarea } from '@/components/ui/textarea'
import { FileDropZone } from './file-drop-zone'
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
  const tCommon = useTranslations('Common')
  const [geoIdText, setGeoIdText] = useState('')
  const [geoIdFileName, setGeoIdFileName] = useState('')
  const [analysisOptions, setAnalysisOptions] = useState<AnalysisOptionsValue>(DEFAULT_ANALYSIS_OPTIONS)

  const cleanIds = parseGeoIdText(geoIdText)
  const featureCount = cleanIds.length

  const { submit, isLoading, error: submitError } = useSubmitAnalysis({
    analysisOptions,
    featureCount,
    asyncThreshold,
    agent: 'ui:geoids',
  })

  useEffect(() => {
    if (submitError) onError(submitError)
  }, [submitError, onError])

  const reset = () => {
    setGeoIdText('')
    setGeoIdFileName('')
    onError('')
  }

  const handleGeoIdFile = async (file: File) => {
    onError('')
    if (maxFileSize && file.size > maxFileSize) {
      onError(t('fileTooLarge', { maxKb: maxFileSize / 1024 }))
      setGeoIdFileName('')
      return
    }
    const result = await parseGeoIdFile(file)
    if (!Array.isArray(result)) {
      onError(t(`fileErrors.${result.error}`))
      setGeoIdFileName('')
      return
    }
    setGeoIdFileName(file.name)
    setGeoIdText(result.join('\n'))
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
      <div className="flex items-stretch gap-0 min-h-40 max-sm:flex-col">
        <FileDropZone
          accept=".txt"
          fileName={geoIdFileName}
          onFile={handleGeoIdFile}
          formats={t('txtFile')}
          compact
        />

        <div className="flex-shrink-0 w-8 flex items-center justify-center text-[11px] text-text-muted max-sm:w-full max-sm:py-1.5 max-sm:justify-center">
          {tCommon('or')}
        </div>

        <Textarea
          value={geoIdText}
          onChange={(e) => { setGeoIdText(e.target.value); setGeoIdFileName('') }}
          placeholder={t('geoIdsPlaceholder')}
          className="flex-1 font-mono max-sm:min-h-24"
        />
      </div>

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
