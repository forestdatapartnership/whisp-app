'use client'

import { useFormatter, useTranslations } from 'next-intl'
import { Check, Download, Hand, PencilLine, Plus, Trash2, Undo2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { actionRow } from '@/components/ui/styles'
import { ringAreaHa, type LatLng, type ShapeIssue } from '@/lib/draw/geometry'

const ISSUE_KEYS: Record<ShapeIssue, string> = {
  open: 'draw.needMore',
  crossing: 'draw.crossing',
  flat: 'draw.degenerate',
  large: 'draw.tooLarge',
}

interface DrawActionsProps {
  vertices: LatLng[]
  issue: ShapeIssue | null
  maxPlotAreaHa?: number
  hasShapes: boolean
  ready: boolean
  drawing: boolean
  crosshair: boolean
  canUndo: boolean
  canUse: boolean
  canDownload: boolean
  onDrawingChange: (drawing: boolean) => void
  onAddShape: () => void
  onUndo: () => void
  onDelete: () => void
  onDownload: () => void
  onUse: () => void
  onCrosshairChange: (show: boolean) => void
}

export function DrawActions({
  vertices,
  issue,
  maxPlotAreaHa,
  hasShapes,
  ready,
  drawing,
  crosshair,
  canUndo,
  canUse,
  canDownload,
  onDrawingChange,
  onAddShape,
  onUndo,
  onDelete,
  onDownload,
  onUse,
  onCrosshairChange,
}: DrawActionsProps) {
  const t = useTranslations('Submission')
  const format = useFormatter()
  const count = vertices.length

  const status = (): [message: string, invalid: boolean] => {
    if (!drawing) return [t('draw.statusNavigate'), false]
    if (count === 0) return [hasShapes ? t('draw.statusSelect') : t('draw.statusStart'), false]
    if (count === 1) return [t('draw.statusPoint'), false]
    if (issue) return [t(ISSUE_KEYS[issue], { limit: maxPlotAreaHa ?? 0 }), issue !== 'open']
    return [t('draw.summaryEditing', {
      points: count,
      area: format.number(ringAreaHa(vertices), { maximumFractionDigits: 2 }),
    }), false]
  }

  const [message, invalid] = status()

  return (
    <div className="flex shrink-0 flex-col gap-2 border-t border-border bg-surface px-4 py-3">
      {/* Room for two lines, so a rewrapping status doesn't resize the map under the crosshair. */}
      <div className="flex min-h-9 items-center justify-between gap-3">
        <p aria-live="polite" className={cn('text-[12px]', invalid ? 'text-destructive' : 'text-text-muted')}>{message}</p>

        {drawing && (
          <Label className="shrink-0">
            <Switch size="sm" checked={crosshair} onCheckedChange={onCrosshairChange} />
            {t('draw.crosshair')}
          </Label>
        )}
      </div>

      <div className={actionRow}>
        {/* Icon-only on small screens so the tools fit one row and the map keeps its height. */}
        <div className="flex flex-wrap gap-2 max-sm:[&>*]:flex-1">
          <Button type="button" variant="outline" onClick={() => onDrawingChange(!drawing)} disabled={!ready}>
            {drawing ? <Hand className="size-3.5" /> : <PencilLine className="size-3.5" />}
            <span className="max-md:sr-only">{drawing ? t('draw.stopDrawing') : t('draw.startDrawing')}</span>
          </Button>

          <Button type="button" variant="outline" onClick={onAddShape} disabled={count === 0 || issue !== null}>
            <Plus className="size-3.5" />
            <span className="max-md:sr-only">{t('draw.newShape')}</span>
          </Button>

          <Button type="button" variant="outline" onClick={onUndo} disabled={!canUndo}>
            <Undo2 className="size-3.5" />
            <span className="max-md:sr-only">{t('draw.undo')}</span>
          </Button>

          <Button type="button" variant="outline" onClick={onDelete} disabled={count === 0}>
            <Trash2 className="size-3.5" />
            <span className="max-md:sr-only">{t('draw.delete')}</span>
          </Button>

          <Button type="button" variant="outline" onClick={onDownload} disabled={!canDownload}>
            <Download className="size-3.5" />
            <span className="max-md:sr-only">{t('draw.download')}</span>
          </Button>
        </div>

        <Button type="button" onClick={onUse} disabled={!canUse}>
          <Check className="size-4" />
          {t('draw.useShapes')}
        </Button>
      </div>
    </div>
  )
}
