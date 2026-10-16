'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { useTranslations } from 'next-intl'
import { Dialog } from '@base-ui/react/dialog'
import { Crosshair } from 'lucide-react'
import type { LocationEvent, Map as LeafletMap } from 'leaflet'
import { Button, CloseButton } from '@/components/ui/button'
import { cardBase, controlSize } from '@/components/ui/styles'
import { shapeIssue, type LatLng } from '@/lib/draw/geometry'
import { isEdited, toGeoJson, toShapes, type SourceFeature } from '@/lib/draw/geojson'
import { downloadBlob, timestampFilename } from '@/lib/utils/export'
import { DrawActions } from './draw-actions'
import type { LocationFix } from './draw-map'
import { LocatePanel, type LocateStatus } from './locate-panel'
import { useShapes } from './use-shapes'

const LOCATE_ZOOM = 17

function MapLoading() {
  const t = useTranslations('Common')
  return (
    <div className="flex h-full w-full items-center justify-center bg-bg">
      <span className="text-[11px] tracking-[0.04em] text-text-dim">{t('loading')}</span>
    </div>
  )
}

const DrawMap = dynamic(() => import('./draw-map').then((m) => m.DrawMap), {
  ssr: false,
  loading: MapLoading,
})

interface DrawDialogProps {
  features: SourceFeature[]
  maxPlotAreaHa?: number
  onConfirm: (geojson: string) => void
  onClose: () => void
}

export function DrawDialog({ features, maxPlotAreaHa, onConfirm, onClose }: DrawDialogProps) {
  const t = useTranslations('Submission')
  const [{ shapes: initialShapes, locked }] = useState(() => toShapes(features))
  const { shapes, active, add, remove, startMove, move, select, removeActive, undo, canUndo } = useShapes(initialShapes)
  const [map, setMap] = useState<LeafletMap | null>(null)
  const [drawing, setDrawing] = useState(initialShapes.length > 0)
  const [crosshair, setCrosshair] = useState(false)
  const [locateStatus, setLocateStatus] = useState<LocateStatus>('idle')
  const [fix, setFix] = useState<LocationFix | null>(null)

  useEffect(() => {
    if (!map) return
    const found = (e: LocationEvent) => {
      setFix({ point: e.latlng, accuracy: e.accuracy })
      setLocateStatus('idle')
    }
    const failed = () => setLocateStatus('failed')
    map.on('locationfound', found)
    map.on('locationerror', failed)
    return () => {
      map.off('locationfound', found)
      map.off('locationerror', failed)
    }
  }, [map])

  const locate = () => {
    if (!map) return
    setLocateStatus('locating')
    map.locate({ setView: true, maxZoom: LOCATE_ZOOM, enableHighAccuracy: true, timeout: 10_000 })
  }

  const goTo = (point: LatLng) => {
    map?.setView(point, LOCATE_ZOOM)
    setLocateStatus('idle')
  }

  const changeDrawing = (next: boolean) => {
    setDrawing(next)
    if (next) map?.getContainer().focus()
  }

  const addAtCenter = () => {
    if (map) add(map.getCenter())
  }

  const download = () =>
    downloadBlob(new Blob([toGeoJson(features, shapes)], { type: 'application/geo+json' }), timestampFilename('geojson', 'plots'))

  const requestClose = () => {
    if (!canUndo || window.confirm(t('draw.discardChanges'))) onClose()
  }

  const vertices = active?.vertices ?? []
  // Untouched shapes are passed through as they came, so only edits have to be valid.
  const issue = active && isEdited(active) ? shapeIssue(vertices, maxPlotAreaHa) : null
  const canUse = !issue
  // A shape being drawn takes every click as a vertex, so tracing along a neighbour can't switch to it.
  const canSelect = !active || (active.source !== undefined && !issue)

  return (
    <Dialog.Root open onOpenChange={(nextOpen) => { if (!nextOpen) requestClose() }}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-[300] bg-bg/70" />
        <Dialog.Viewport className="fixed inset-0 z-[301] flex items-center justify-center p-2 sm:p-4">
          <Dialog.Popup className={`${cardBase} flex h-full max-h-[720px] w-full max-w-[880px] flex-col overflow-hidden shadow-xl`}>
            <header className="flex shrink-0 items-center justify-between gap-2 border-b border-border px-4 py-2.5">
              <div className="flex min-w-0 items-baseline gap-2">
                <Dialog.Title className="truncate text-sm font-semibold text-text-primary">{t('draw.title')}</Dialog.Title>
                {locked.length > 0 && (
                  <span className="truncate text-[12px] text-text-muted">{t('draw.readOnly')}</span>
                )}
              </div>
              <CloseButton type="button" className={controlSize.md} onClick={requestClose} />
            </header>

            <LocatePanel ready={map !== null} status={locateStatus} onLocate={locate} onGoTo={goTo} />

            <div className="relative flex-1 overflow-hidden">
              <DrawMap
                shapes={shapes}
                active={active}
                canSelect={canSelect}
                locked={locked}
                drawing={drawing}
                fix={fix}
                onMap={setMap}
                onAddVertex={add}
                onRemoveVertex={remove}
                onMoveStart={startMove}
                onMove={move}
                onSelect={select}
              />

              {drawing && crosshair && (
                <>
                  <div className="whisp-crosshair pointer-events-none absolute left-1/2 top-1/2 z-10 size-7 -translate-x-1/2 -translate-y-1/2" />
                  <Button
                    type="button"
                    className="absolute bottom-10 left-1/2 z-10 -translate-x-1/2 shadow-xl"
                    onClick={addAtCenter}
                    disabled={!map}
                  >
                    <Crosshair className="size-4" />
                    {t('draw.addAtCenter')}
                  </Button>
                </>
              )}
            </div>

            <DrawActions
              vertices={vertices}
              issue={issue}
              maxPlotAreaHa={maxPlotAreaHa}
              hasShapes={shapes.length > 0}
              ready={map !== null}
              drawing={drawing}
              crosshair={crosshair}
              canUndo={canUndo}
              canUse={canUse}
              canDownload={!issue && (shapes.length > 0 || locked.length > 0)}
              onDrawingChange={changeDrawing}
              onAddShape={() => select(null)}
              onUndo={undo}
              onDelete={removeActive}
              onDownload={download}
              onUse={() => onConfirm(toGeoJson(features, shapes))}
              onCrosshairChange={setCrosshair}
            />
          </Dialog.Popup>
        </Dialog.Viewport>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
