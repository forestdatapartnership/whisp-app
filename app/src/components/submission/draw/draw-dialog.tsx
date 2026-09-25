'use client'

import { useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import { useTranslations } from 'next-intl'
import { Dialog } from '@base-ui/react/dialog'
import './draw-map.css'
import { Crosshair } from 'lucide-react'
import type { Map as LeafletMap } from 'leaflet'
import { Button, CloseButton } from '@/components/ui/button'
import { cardBase, controlSize } from '@/components/ui/styles'
import { useVertices, type Vertex } from '@/lib/draw/use-vertices'
import { isValidPlot, ringAreaHa, selfIntersects, type LatLng } from '@/lib/draw/geometry'
import { downloadPlot } from '@/lib/draw/download'
import { DrawActions } from './draw-actions'
import { LocatePanel } from './locate-panel'

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
  initialVertices: Vertex[]
  maxPlotAreaHa?: number
  onConfirm: (vertices: Vertex[]) => void
  onClose: () => void
}

export function DrawDialog({ initialVertices, maxPlotAreaHa, onConfirm, onClose }: DrawDialogProps) {
  const t = useTranslations('Submission')
  const mapRef = useRef<LeafletMap | null>(null)
  const [crosshair, setCrosshair] = useState(false)
  const { vertices, add, remove, move, clear, undo, canUndo } = useVertices(initialVertices)
  const [mapReady, setMapReady] = useState(false)
  // Reopening an existing plot means editing it, so skip the navigate step.
  const [drawing, setDrawing] = useState(initialVertices.length > 0)
  const [locating, setLocating] = useState(false)
  const [locateFailed, setLocateFailed] = useState(false)

  const locate = () => {
    const map = mapRef.current
    if (!map) return
    setLocateFailed(false)
    setLocating(true)
    map.locate({ setView: true, maxZoom: LOCATE_ZOOM, enableHighAccuracy: true, timeout: 10_000 })
  }

  const stopLocating = () => setLocating(false)

  const failLocating = () => {
    setLocating(false)
    setLocateFailed(true)
  }

  const goTo = (point: LatLng) => {
    const map = mapRef.current
    if (!map) return
    map.setView([point.lat, point.lng], LOCATE_ZOOM)
    setLocateFailed(false)
  }

  const changeDrawing = (next: boolean) => {
    setDrawing(next)
    if (next) mapRef.current?.getContainer().focus()
  }

  const addAtCenter = () => {
    const center = mapRef.current?.getCenter()
    if (center) add(center)
  }

  const requestClose = () => {
    if (!canUndo || window.confirm(t('draw.discardChanges'))) onClose()
  }

  const crossing = selfIntersects(vertices)
  const areaHa = ringAreaHa(vertices)
  const tooLarge = maxPlotAreaHa != null && areaHa > maxPlotAreaHa
  const canUse = isValidPlot(vertices.length, crossing, areaHa) && !tooLarge

  return (
    <Dialog.Root open onOpenChange={(nextOpen) => { if (!nextOpen) requestClose() }}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-[300] bg-bg/70" />
        <Dialog.Viewport className="fixed inset-0 z-[301] flex items-center justify-center p-2 sm:p-4">
          <Dialog.Popup className={`${cardBase} flex h-full max-h-[720px] w-full max-w-[880px] flex-col overflow-hidden shadow-xl`}>
            <header className="flex shrink-0 items-center justify-between gap-2 border-b border-border px-4 py-2.5">
              <Dialog.Title className="truncate text-sm font-semibold text-text-primary">{t('draw.title')}</Dialog.Title>
              <CloseButton type="button" className={controlSize.md} onClick={requestClose} />
            </header>

            <LocatePanel
              ready={mapReady}
              locating={locating}
              failed={locateFailed}
              onLocate={locate}
              onGoTo={goTo}
            />

            <div className="relative flex-1 overflow-hidden">
              <DrawMap
                vertices={vertices}
                drawing={drawing}
                mapRef={mapRef}
                onReady={() => setMapReady(true)}
                onAddVertex={add}
                onRemoveVertex={remove}
                onMove={move}
                onLocated={stopLocating}
                onLocateError={failLocating}
              />

              {drawing && crosshair && (
                <>
                  <div className="whisp-crosshair pointer-events-none absolute left-1/2 top-1/2 z-10 size-7 -translate-x-1/2 -translate-y-1/2" />
                  <Button
                    type="button"
                    className="absolute bottom-10 left-1/2 z-10 -translate-x-1/2 shadow-xl"
                    onClick={addAtCenter}
                    disabled={!mapReady}
                  >
                    <Crosshair className="size-4" />
                    {t('draw.addAtCenter')}
                  </Button>
                </>
              )}
            </div>

            <DrawActions
              count={vertices.length}
              areaHa={areaHa}
              crossing={crossing}
              maxPlotAreaHa={maxPlotAreaHa}
              ready={mapReady}
              drawing={drawing}
              crosshair={crosshair}
              canUndo={canUndo}
              canUse={canUse}
              onDrawingChange={changeDrawing}
              onUndo={undo}
              onClear={clear}
              onUse={() => onConfirm(vertices)}
              onDownload={() => downloadPlot(vertices)}
              onCrosshairChange={setCrosshair}
            />
          </Dialog.Popup>
        </Dialog.Viewport>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
