'use client'

import { useFormatter, useTranslations } from 'next-intl'
import { Check, Download, Hand, PencilLine, Trash2, Undo2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'

interface DrawActionsProps {
  count: number
  areaHa: number
  crossing: boolean
  maxPlotAreaHa?: number
  ready: boolean
  drawing: boolean
  crosshair: boolean
  canUndo: boolean
  canUse: boolean
  onDrawingChange: (drawing: boolean) => void
  onUndo: () => void
  onClear: () => void
  onUse: () => void
  onDownload: () => void
  onCrosshairChange: (show: boolean) => void
}

export function DrawActions({
  count,
  areaHa,
  crossing,
  maxPlotAreaHa,
  ready,
  drawing,
  crosshair,
  canUndo,
  canUse,
  onDrawingChange,
  onUndo,
  onClear,
  onUse,
  onDownload,
  onCrosshairChange,
}: DrawActionsProps) {
  const t = useTranslations('Submission')
  const tCommon = useTranslations('Common')
  const format = useFormatter()

  const status = (): [message: string, invalid: boolean] => {
    if (!drawing) return [t('draw.statusNavigate'), false]
    if (count === 0) return [t('draw.statusStart'), false]
    if (count === 1) return [t('draw.statusPoint'), false]
    if (count === 2) return [t('draw.needMore'), false]
    if (crossing) return [t('draw.crossing'), true]
    if (areaHa === 0) return [t('draw.degenerate'), true]
    if (maxPlotAreaHa != null && areaHa > maxPlotAreaHa) return [t('draw.tooLarge', { limit: maxPlotAreaHa }), true]
    return [t('draw.summaryEditing', {
      points: count,
      area: format.number(areaHa, { maximumFractionDigits: 2 }),
    }), false]
  }

  const [message, invalid] = status()

  return (
    <div className="flex shrink-0 flex-col gap-2 border-t border-border bg-surface px-4 py-3">
      {/* Fixed height: a status line that rewraps resizes the map under the crosshair. */}
      <div className="flex min-h-9 items-center justify-between gap-3">
        <p aria-live="polite" className={`text-[12px] ${invalid ? 'text-destructive' : 'text-text-muted'}`}>{message}</p>

        {drawing && (
          <Label className="shrink-0">
            <Switch size="sm" checked={crosshair} onCheckedChange={onCrosshairChange} />
            {t('draw.crosshair')}
          </Label>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" variant="outline" onClick={() => onDrawingChange(!drawing)} disabled={!ready}>
          {drawing ? <Hand className="size-3.5" /> : <PencilLine className="size-3.5" />}
          {drawing ? t('draw.stopDrawing') : t('draw.startDrawing')}
        </Button>

        <Button type="button" variant="outline" onClick={onUndo} disabled={!canUndo}>
          <Undo2 className="size-3.5" />
          {t('draw.undo')}
        </Button>

        <Button type="button" variant="outline" onClick={onClear} disabled={count === 0}>
          <Trash2 className="size-3.5" />
          {tCommon('clear')}
        </Button>

        <Button type="button" variant="outline" onClick={onDownload} disabled={!canUse}>
          <Download className="size-3.5" />
          {t('draw.download')}
        </Button>

        <Button type="button" className="w-full sm:flex-1" onClick={onUse} disabled={!canUse}>
          <Check className="size-4" />
          {count === 1 ? t('draw.usePoint') : t('draw.usePlot')}
        </Button>
      </div>
    </div>
  )
}
