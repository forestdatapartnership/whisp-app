'use client'

import { useEffect, useRef, useState } from 'react'
import {
  Circle,
  CircleMarker,
  GeoJSON,
  MapContainer,
  Marker,
  Polygon,
  Polyline,
  ScaleControl,
  useMap,
  useMapEvent,
  useMapEvents,
} from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import '@/components/plots/leaflet-dark.css'
import './draw-map.css'
import { BaseLayers, SATELLITE_MAX_ZOOM } from '@/components/plots/base-layers'
import type { LatLng } from '@/lib/draw/geometry'
import type { Shape, SourceFeature } from '@/lib/draw/geojson'

export interface LocationFix {
  point: LatLng
  accuracy: number
}

const DEFAULT_CENTER: L.LatLngTuple = [0, 20]
const DEFAULT_ZOOM = 3
const FIT_OPTIONS: L.FitBoundsOptions = { padding: [48, 48], maxZoom: SATELLITE_MAX_ZOOM }

const MIN_SHAPE_PX = 12
const DOT_RADIUS = 6

const dotStyle = (fillColor: string) => ({ color: '#111827', weight: 2, fillColor, fillOpacity: 1 })

const SHAPE_COLORS = ['#facc15', '#22d3ee', '#f472b6', '#a3e635', '#fb923c', '#a78bfa']

const SHAPE_STYLES = SHAPE_COLORS.map((color) => ({
  idle: { color, weight: 2, fillOpacity: 0.2 },
  active: { color, weight: 3, fillOpacity: 0.35 },
  open: { color, weight: 3, dashArray: '5 5' },
  dot: dotStyle(color),
}))

const styleOf = (shape: Shape) => SHAPE_STYLES[shape.id % SHAPE_STYLES.length]

const LOCKED_COLOR = '#e5e7eb'
const LOCKED = { color: LOCKED_COLOR, weight: 2, dashArray: '4 4', fillOpacity: 0.1 }
const LOCKED_DOT = dotStyle(LOCKED_COLOR)
const ACCURACY = { color: LOCKED_COLOR, weight: 1, fillOpacity: 0.1 }

const vertexIcon = L.divIcon({
  className: 'whisp-vertex-icon',
  html: '<span class="whisp-vertex"></span>',
  iconSize: [22, 22],
  iconAnchor: [11, 11],
})

function initialView(shapes: Shape[], locked: SourceFeature[]) {
  const bounds = L.geoJSON(locked).getBounds()
  shapes.forEach((shape) => shape.vertices.forEach((vertex) => bounds.extend(vertex)))
  return bounds.isValid()
    ? { bounds, boundsOptions: FIT_OPTIONS }
    : { center: DEFAULT_CENTER, zoom: DEFAULT_ZOOM }
}

function useIsTiny() {
  const map = useMap()
  const [zoom, setZoom] = useState(() => map.getZoom())
  useMapEvent('zoomend', () => setZoom(map.getZoom()))

  return (bounds: L.LatLngBounds) => {
    const size = map.project(bounds.getNorthEast(), zoom).subtract(map.project(bounds.getSouthWest(), zoom))
    return Math.max(Math.abs(size.x), Math.abs(size.y)) < MIN_SHAPE_PX
  }
}

function MapBehaviour({ drawing, onClick }: { drawing: boolean; onClick: (point: LatLng) => void }) {
  const map = useMapEvents({
    click: (e) => { if (drawing) onClick(e.latlng) },
  })

  // Keeps getCenter() under the crosshair while the dialog layout settles.
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

interface IdleShapesProps {
  shapes: Shape[]
  drawing: boolean
  canSelect: boolean
  onAddVertex: (point: LatLng) => void
  onSelect: (id: number) => void
}

function IdleShapes({ shapes, drawing, canSelect, onAddVertex, onSelect }: IdleShapesProps) {
  const map = useMap()
  const isTiny = useIsTiny()

  const click = (shape: Shape, bounds: L.LatLngBounds, tiny: boolean, point: LatLng) => {
    if (drawing && !canSelect) {
      onAddVertex(point)
      return
    }
    if (tiny) map.fitBounds(bounds, FIT_OPTIONS)
    if (drawing) onSelect(shape.id)
  }

  return shapes.map((shape) => {
    const style = styleOf(shape)
    const bounds = L.latLngBounds(shape.vertices)
    const tiny = shape.vertices.length > 1 && isTiny(bounds)
    const eventHandlers = { click: (e: L.LeafletMouseEvent) => click(shape, bounds, tiny, e.latlng) }

    if (shape.vertices.length === 1 || tiny) {
      return (
        <CircleMarker
          key={shape.id}
          center={shape.vertices[0]}
          radius={DOT_RADIUS}
          pathOptions={style.dot}
          bubblingMouseEvents={false}
          eventHandlers={eventHandlers}
        />
      )
    }
    return (
      <Polygon
        key={shape.id}
        positions={shape.vertices}
        pathOptions={style.idle}
        bubblingMouseEvents={false}
        eventHandlers={eventHandlers}
      />
    )
  })
}

const lockedPoint = (_: unknown, latlng: L.LatLng) =>
  L.circleMarker(latlng, { radius: DOT_RADIUS, interactive: false })

function LockedFeatures({ features }: { features: SourceFeature[] }) {
  const isTiny = useIsTiny()
  const [layers] = useState(() =>
    features
      .map((feature) => ({ feature, bounds: L.geoJSON(feature).getBounds() }))
      .filter(({ bounds }) => bounds.isValid())
      .map((layer) => ({ ...layer, center: layer.bounds.getCenter() }))
  )

  return layers.map(({ feature, bounds, center }, index) =>
    isTiny(bounds) ? (
      <CircleMarker key={index} center={center} radius={DOT_RADIUS} pathOptions={LOCKED_DOT} interactive={false} />
    ) : (
      <GeoJSON key={index} data={feature} style={LOCKED} interactive={false} pointToLayer={lockedPoint} />
    )
  )
}

interface DrawMapProps {
  shapes: Shape[]
  active?: Shape
  canSelect: boolean
  locked: SourceFeature[]
  drawing: boolean
  fix: LocationFix | null
  onMap: (map: L.Map | null) => void
  onAddVertex: (point: LatLng) => void
  onRemoveVertex: (index: number) => void
  onMoveStart: () => void
  onMove: (index: number, point: LatLng) => void
  onSelect: (id: number) => void
}

export function DrawMap({
  shapes,
  active,
  canSelect,
  locked,
  drawing,
  fix,
  onMap,
  onAddVertex,
  onRemoveVertex,
  onMoveStart,
  onMove,
  onSelect,
}: DrawMapProps) {
  const [view] = useState(() => initialView(shapes, locked))
  // Leaflet also fires clicks when a drag ends; they must not remove or add a vertex.
  const dragging = useRef(false)
  const vertices = active?.vertices ?? []
  const activeStyle = active && styleOf(active)

  const addVertex = (point: LatLng) => { if (!dragging.current) onAddVertex(point) }

  return (
    <MapContainer ref={onMap} {...view} className="h-full w-full">
      <MapBehaviour drawing={drawing} onClick={addVertex} />

      <BaseLayers defaultLayer="satellite" />

      <ScaleControl position="bottomleft" />

      {fix && <Circle center={fix.point} radius={fix.accuracy} pathOptions={ACCURACY} />}

      <LockedFeatures features={locked} />

      <IdleShapes
        shapes={shapes.filter((shape) => shape !== active)}
        drawing={drawing}
        canSelect={canSelect}
        onAddVertex={addVertex}
        onSelect={onSelect}
      />

      {activeStyle && vertices.length >= 3 && <Polygon positions={vertices} pathOptions={activeStyle.active} />}
      {activeStyle && vertices.length === 2 && <Polyline positions={vertices} pathOptions={activeStyle.open} />}

      {vertices.map((vertex, index) => (
        <Marker
          key={index}
          position={vertex}
          icon={vertexIcon}
          draggable={drawing}
          bubblingMouseEvents={false}
          eventHandlers={{
            dragstart: () => {
              dragging.current = true
              onMoveStart()
            },
            drag: (e) => onMove(index, (e.target as L.Marker).getLatLng()),
            dragend: () => { setTimeout(() => { dragging.current = false }, 0) },
            click: () => { if (drawing && !dragging.current) onRemoveVertex(index) },
          }}
        />
      ))}
    </MapContainer>
  )
}
