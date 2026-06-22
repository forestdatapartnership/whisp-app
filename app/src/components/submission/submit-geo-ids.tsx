'use client'

import { useState, useEffect } from 'react'
import { Download, Trash2, Play, Loader2, AlertTriangle } from 'lucide-react'
import { parseGeoIdText, parseGeoIdFile } from '@/lib/utils/file-parser'
import { useSubmitAnalysis } from '@/lib/submission/useSubmitAnalysis'
import { Button } from '@/components/ui/button'
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
  const [geoIdText, setGeoIdText] = useState('')
  const [geoIdFileName, setGeoIdFileName] = useState('')
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
    setGeoIdFileName('')
    onError('')
  }

  const handleGeoIdFile = async (file: File) => {
    onError('')
    if (maxFileSize && file.size > maxFileSize) {
      onError(`File too large. Maximum is ${maxFileSize / 1024} KB.`)
      setGeoIdFileName('')
      return
    }
    const result = await parseGeoIdFile(file)
    if (!Array.isArray(result)) {
      onError(result.error)
      setGeoIdFileName('')
      return
    }
    setGeoIdFileName(file.name)
    setGeoIdText(result.join('\n'))
  }

  const handleAnalyze = () => {
    if (cleanIds.length === 0) {
      onError('Please enter at least one Geo ID or upload a file.')
      return
    }
    if (geometryLimit && cleanIds.length > geometryLimit) {
      onError(`Too many Geo IDs. Maximum allowed is ${geometryLimit}.`)
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
          formats=".txt file"
          compact
        />

        <div className="flex-shrink-0 w-8 flex items-center justify-center text-[11px] text-text-muted max-sm:w-full max-sm:py-1.5 max-sm:justify-center">
          or
        </div>

        <Textarea
          value={geoIdText}
          onChange={(e) => { setGeoIdText(e.target.value); setGeoIdFileName('') }}
          placeholder={"Paste Geo IDs\none per line\n\ne.g. 20230001\n     20230002"}
          className="flex-1 font-mono max-sm:min-h-24"
        />
      </div>

      <div className="flex items-start gap-2 text-[12px] text-text-muted leading-relaxed">
        <AlertTriangle className="size-3.5 flex-shrink-0 mt-0.5 text-yellow-500" />
        IDs must correspond to registered plot geometries in the system.
      </div>

      <AnalysisOptions value={analysisOptions} onChange={setAnalysisOptions} />

      <div className="flex items-center gap-2">
        <Button type="button" variant="outline" onClick={downloadExample}>
          <Download className="size-3.5" />
          Example
        </Button>
        <Button type="button" variant="outline" onClick={reset}>
          <Trash2 className="size-3.5" />
          Clear
        </Button>
        <Button
          type="button"
          className="flex-1"
          disabled={isLoading || cleanIds.length === 0}
          onClick={handleAnalyze}
        >
          {isLoading ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Play className="size-4" />
          )}
          {isLoading ? 'Running Analysis…' : 'Run Analysis'}
        </Button>
      </div>
    </div>
  )
}
