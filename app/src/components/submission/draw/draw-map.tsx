'use client'

import { useEffect, useRef, useState, type RefObject } from 'react'
import { MapContainer, Polygon, Polyline, Marker, Circle, ScaleControl, useMap, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import '@/components/plots/leaflet-dark.css'
import './draw-map.css'
import { BaseLayers } from '@/components/plots/base-layers'
import type { LatLng } from '@/lib/draw/geometry'
import type { Vertex } from '@/lib/draw/use-vertices'

const POINT_ZOOM = 17
// High-resolution imagery thins out past this, so framing a plot stops here even
// though manual overzoom stays available for placing vertices.
const FIT_MAX_ZOOM = 18

const vertexIcon = L.divIcon({
  className: 'whisp-vertex-icon',
  html: '<span class="whisp-vertex"></span>',
  iconSize: [44, 44],
  iconAnchor: [22, 22],
})

const SHAPE = { color: 'var(--accent-green)', weight: 2, fillOpacity: 0.2 }
const OPEN_SHAPE = { color: 'var(--accent-green)', weight: 2, dashArray: '5 5' }
const ACCURACY = { color: 'var(--text-muted)', weight: 1, fillOpacity: 0.1 }

interface MapBehaviourProps {
  drawing: boolean
  onClick: (point: LatLng) => void
  onFix: (point: LatLng, accuracy: number) => void
  onLocateError: () => void
}

function MapBehaviour({ drawing, onClick, onFix, onLocateError }: MapBehaviourProps) {
  const map = useMapEvents({
    click: (e) => { if (drawing) onClick(e.latlng) },
    locationfound: (e) => onFix(e.latlng, e.accuracy),
    locationerror: onLocateError,
  })

  // The dialog's layout keeps settling after the map mounts, and a stale cached size
  // puts getCenter() away from the visible centre the crosshair marks.
  useEffect(() => {
    const observer = new ResizeObserver(() => map.invalidateSize())
    observer.observe(map.getContainer())
    return () => observer.disconnect()
  }, [map])

  // MapContainer props are read once at mount, so drawing mode is applied here.
  useEffect(() => {
    const container = map.getContainer()
    container.classList.toggle('leaflet-crosshair', drawing)
    if (drawing) map.doubleClickZoom.disable()
    else map.doubleClickZoom.enable()
    return () => {
      container.classList.remove('leaflet-crosshair')
      map.doubleClickZoom.enable()
    }
  }, [drawing, map])

  return null
}

/** Frames the plot the editor opened with; the map remounts per open, so this runs once. */
function FitToPlot({ vertices }: { vertices: Vertex[] }) {
  const map = useMap()
  const opened = useRef(vertices)

  useEffect(() => {
    const plot = opened.current
    if (plot.length === 0) return
    if (plot.length === 1) {
      map.setView([plot[0].lat, plot[0].lng], POINT_ZOOM)
      return
    }
    map.fitBounds(L.latLngBounds(plot.map((v) => [v.lat, v.lng])), { padding: [48, 48], maxZoom: FIT_MAX_ZOOM })
  }, [map])

  return null
}

interface DrawMapProps {
  vertices: Vertex[]
  drawing: boolean
  mapRef: RefObject<L.Map | null>
  onReady: () => void
  onAddVertex: (point: LatLng) => void
  onRemoveVertex: (id: number) => void
  onMove: (id: number, point: LatLng) => void
  onLocated: () => void
  onLocateError: () => void
}

export function DrawMap({
  vertices,
  drawing,
  mapRef,
  onReady,
  onAddVertex,
  onRemoveVertex,
  onMove,
  onLocated,
  onLocateError,
}: DrawMapProps) {
  const [fix, setFix] = useState<{ point: LatLng; accuracy: number } | null>(null)
  // Leaflet emits both a marker and a map click when a drag ends, which would
  // otherwise remove the vertex or drop a spare one at the release point.
  const dragging = useRef(false)
  const path = vertices.map((v) => [v.lat, v.lng] as [number, number])

  return (
    <MapContainer
      ref={mapRef}
      whenReady={onReady}
      center={[0, 20]}
      zoom={3}
      attributionControl
      scrollWheelZoom
      className="h-full w-full"
    >
      <MapBehaviour
        drawing={drawing}
        onClick={(point) => { if (!dragging.current) onAddVertex(point) }}
        onFix={(point, accuracy) => { setFix({ point, accuracy }); onLocated() }}
        onLocateError={onLocateError}
      />

      <BaseLayers defaultLayer="satellite" />

      <FitToPlot vertices={vertices} />

      <ScaleControl position="bottomleft" />

      {fix && <Circle center={fix.point} radius={fix.accuracy} pathOptions={ACCURACY} />}

      {vertices.length >= 3 && <Polygon positions={path} pathOptions={SHAPE} />}
      {vertices.length === 2 && <Polyline positions={path} pathOptions={OPEN_SHAPE} />}

      {vertices.map((vertex) => (
        <Marker
          key={vertex.id}
          position={[vertex.lat, vertex.lng]}
          icon={vertexIcon}
          draggable={drawing}
          bubblingMouseEvents={false}
          eventHandlers={{
            dragstart: () => { dragging.current = true },
            drag: (e) => onMove(vertex.id, (e.target as L.Marker).getLatLng()),
            dragend: () => { setTimeout(() => { dragging.current = false }, 0) },
            click: () => { if (drawing && !dragging.current) onRemoveVertex(vertex.id) },
          }}
        />
      ))}
    </MapContainer>
  )
}
