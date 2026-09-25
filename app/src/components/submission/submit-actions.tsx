'use client'

import type { ReactNode } from 'react'
import { useTranslations } from 'next-intl'
import { Download, Loader2, Play, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { actionRow } from '@/components/ui/styles'

interface SubmitActionsProps {
  downloadVisible?: boolean
  downloadLabel?: string
  onDownload?: () => void
  downloadDisabled?: boolean
  onClear: () => void
  clearDisabled?: boolean
  runLabel: string
  runIcon?: ReactNode
  onRun: () => void
  runDisabled?: boolean
  isLoading?: boolean
}

export function SubmitActions({
  downloadVisible,
  downloadLabel,
  onDownload,
  downloadDisabled,
  onClear,
  clearDisabled,
  runLabel,
  runIcon = <Play className="size-4" />,
  onRun,
  runDisabled,
  isLoading,
}: SubmitActionsProps) {
  const t = useTranslations('Submission')
  const tCommon = useTranslations('Common')

  return (
    <div className={actionRow}>
      {downloadVisible && (
        <Button type="button" variant="outline" onClick={onDownload} disabled={downloadDisabled}>
          <Download className="size-3.5" />
          {downloadLabel}
        </Button>
      )}
      <Button type="button" variant="outline" onClick={onClear} disabled={clearDisabled}>
        <Trash2 className="size-3.5" />
        {tCommon('clear')}
      </Button>
      <Button type="button" onClick={onRun} disabled={isLoading || runDisabled}>
        {isLoading ? <Loader2 className="size-4 animate-spin" /> : runIcon}
        {isLoading ? t('running') : runLabel}
      </Button>
    </div>
  )
}
