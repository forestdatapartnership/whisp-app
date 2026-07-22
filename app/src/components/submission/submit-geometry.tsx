'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Download, Trash2, Play, Loader2, AlertTriangle } from 'lucide-react'
import { parseGeometryFile } from '@/lib/utils/file-parser'
import type { GeoPayload } from '@/lib/submission/useSubmitAnalysis'
import { useSubmitAnalysis } from '@/lib/submission/useSubmitAnalysis'
import { Button } from '@/components/ui/button'
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
  const [fileName, setFileName] = useState('')
  const [featureCount, setFeatureCount] = useState(0)
  const [payload, setPayload] = useState<GeoPayload | null>(null)
  const [analysisOptions, setAnalysisOptions] = useState<AnalysisOptionsValue>(DEFAULT_ANALYSIS_OPTIONS)

  const appliedFileRef = useRef<File | null>(null)

  const { submit, isLoading, error: submitError } = useSubmitAnalysis({
    analysisOptions,
    featureCount,
    asyncThreshold,
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
      onError(`File too large. Maximum is ${maxFileSize / 1024} KB.`)
      clearFile()
      return
    }

    const result = await parseGeometryFile(file)
    if ('error' in result) {
      onError(result.error)
      clearFile()
      return
    }

    if (geometryLimit && result.featureCount > geometryLimit) {
      onError(`Too many geometries. Maximum allowed is ${geometryLimit}.`)
      clearFile()
      return
    }

    setFileName(file.name)
    setFeatureCount(result.featureCount)
    setPayload('wkt' in result ? { type: 'wkt', wkt: result.wkt } : { type: 'json', geojson: result.json })
  }, [maxFileSize, geometryLimit, onError])

  useEffect(() => {
    if (!initialFile || appliedFileRef.current === initialFile) return
    appliedFileRef.current = initialFile
    void handleFile(initialFile)
  }, [initialFile, handleFile])

  const handleAnalyze = () => {
    if (!payload) {
      onError('Please upload a geometry file.')
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
        <AlertTriangle className="size-3.5 flex-shrink-0 mt-0.5 text-yellow-500" />
        Geometries must use the WGS84 coordinate reference system (EPSG:4326). Entries without coordinates may cause errors.
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
          disabled={isLoading || !payload}
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
