'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { FolderOpen, Trash2, AlertTriangle } from 'lucide-react'
import { parseResultsFile, versionsMatch } from '@/lib/results/parse-results-file'
import { storeLocalResults } from '@/lib/results/local-results'
import { useConfig } from '@/lib/config/config-context'
import { Button } from '@/components/ui/button'
import { Alert } from '@/components/ui/alert'
import { FileDropZone } from './file-drop-zone'
import type { FeatureCollection } from 'geojson'

interface OpenResultsProps {
  onError: (msg: string) => void
  onSubmitGeometry: (file: File) => void
}

function staleMessage(exportVersion: string, currentVersion: string) {
  if (!exportVersion) {
    return 'This file has no openforis-whisp version metadata, so it cannot be opened as GeoJSON results.'
  }
  if (!currentVersion) {
    return 'Could not verify the app library version. Try again in a moment.'
  }
  return `Version mismatch. This export used openforis-whisp ${exportVersion}; the app uses ${currentVersion}. GeoJSON results from other versions cannot be opened because the results set might differ.`
}

export function OpenResults({ onError, onSubmitGeometry }: OpenResultsProps) {
  const router = useRouter()
  const { config } = useConfig()
  const [file, setFile] = useState<File | null>(null)
  const [pending, setPending] = useState<{
    featureCollection: FeatureCollection
    whispVersion: string | null
  } | null>(null)

  const currentVersion = config?.app.openforisWhispVersion?.trim() || ''
  const exportVersion = pending?.whispVersion?.trim() || ''
  const canOpen = Boolean(pending && versionsMatch(exportVersion, currentVersion))
  const needsRerun = Boolean(pending && !canOpen)

  const reset = () => {
    setFile(null)
    setPending(null)
    onError('')
  }

  const handleFile = async (next: File) => {
    onError('')
    const result = await parseResultsFile(next)
    if ('error' in result) {
      setFile(null)
      setPending(null)
      onError(result.error)
      return
    }
    setFile(next)
    setPending(result)
  }

  const handleOpen = () => {
    if (!pending || !canOpen) return
    storeLocalResults(pending.featureCollection, pending.whispVersion)
    router.push('/results/local')
  }

  return (
    <div className="flex flex-col gap-3">
      <FileDropZone
        accept=".json,.geojson"
        fileName={file?.name}
        onFile={handleFile}
        formats=".geojson · .json"
      />
      <div className="flex items-start gap-2 text-[12px] text-text-muted leading-relaxed">
        <AlertTriangle className="size-3.5 flex-shrink-0 mt-0.5 text-yellow-500" />
        Use a GeoJSON you downloaded from WHISP. Only exports matching the current openforis-whisp version can be opened.
      </div>
      {needsRerun && (
        <Alert
          type="warning"
          message={`${staleMessage(exportVersion, currentVersion)} Submit it for a new analysis.`}
        />
      )}
      <div className="flex items-center gap-2">
        <Button type="button" variant="outline" onClick={reset}>
          <Trash2 className="size-3.5" />
          Clear
        </Button>
        {needsRerun ? (
          <Button
            type="button"
            className="flex-1"
            disabled={!file}
            onClick={() => file && onSubmitGeometry(file)}
          >
            Continue to submit
          </Button>
        ) : (
          <Button
            type="button"
            className="flex-1"
            disabled={!canOpen}
            onClick={handleOpen}
          >
            <FolderOpen className="size-4" />
            Open GeoJSON Results
          </Button>
        )}
      </div>
    </div>
  )
}
