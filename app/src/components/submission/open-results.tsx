'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { useRouter } from '@/i18n/navigation'
import { FolderOpen, AlertTriangle } from 'lucide-react'
import { parseResultsFile, versionsMatch } from '@/lib/results/parse-results-file'
import { storeLocalResults } from '@/lib/results/local-results'
import { useConfig } from '@/lib/config/config-context'
import { SubmitActions } from './submit-actions'
import { Alert } from '@/components/ui/alert'
import { FileDropZone } from './file-drop-zone'
import type { FeatureCollection } from 'geojson'

interface OpenResultsProps {
  onError: (msg: string) => void
  onSubmitGeometry: (file: File) => void
}

export function OpenResults({ onError, onSubmitGeometry }: OpenResultsProps) {
  const t = useTranslations('Submission')
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
  const staleMessage = () => {
    if (!exportVersion) return t('noVersion')
    if (!currentVersion) return t('unknownAppVersion')
    return t('versionMismatch', { exportVersion, currentVersion })
  }

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
      onError(t(`fileErrors.${result.error}`))
      return
    }
    setFile(next)
    setPending(result)
  }

  const handleOpen = async () => {
    if (!pending || !canOpen) return
    await storeLocalResults(pending.featureCollection, pending.whispVersion)
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
        <AlertTriangle className="size-3.5 flex-shrink-0 mt-0.5 text-risk-medium" />
        {t('openHint')}
      </div>
      {needsRerun && (
        <Alert
          type="warning"
          message={`${staleMessage()} ${t('resubmit')}`}
        />
      )}
      <SubmitActions
        onClear={reset}
        runLabel={needsRerun ? t('continueToSubmit') : t('openResults')}
        runIcon={needsRerun ? null : <FolderOpen className="size-4" />}
        onRun={() => (needsRerun ? file && onSubmitGeometry(file) : handleOpen())}
        runDisabled={needsRerun ? !file : !canOpen}
      />
    </div>
  )
}
