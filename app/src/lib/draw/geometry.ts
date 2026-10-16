import type { Geometry, MultiPolygon, Point, Polygon, Position } from 'geojson'

export interface LatLng {
  lat: number
  lng: number
}

export type EditableGeometry = Point | Polygon | MultiPolygon

export type ShapeIssue = 'open' | 'crossing' | 'flat' | 'large'

const EARTH_RADIUS_M = 6378137
const SQM_PER_HA = 10_000

const toRad = (deg: number) => (deg * Math.PI) / 180

// EUDR requires at least six decimals; rounding to six also trims the payload.
const round6 = (n: number) => Math.round(n * 1e6) / 1e6

export const inRange = (lat: number, lng: number) => Math.abs(lat) <= 90 && Math.abs(lng) <= 180

export function ringAreaHa(ring: LatLng[]): number {
  if (ring.length < 3) return 0
  let sum = 0
  for (let i = 0; i < ring.length; i++) {
    const a = ring[i]
    const b = ring[(i + 1) % ring.length]
    sum += toRad(b.lng - a.lng) * (2 + Math.sin(toRad(a.lat)) + Math.sin(toRad(b.lat)))
  }
  return Math.abs((sum * EARTH_RADIUS_M * EARTH_RADIUS_M) / 2) / SQM_PER_HA
}

const cross = (o: LatLng, a: LatLng, b: LatLng) =>
  (a.lng - o.lng) * (b.lat - o.lat) - (a.lat - o.lat) * (b.lng - o.lng)

// Segments that only share an endpoint touch rather than cross; flagging them would reject valid rings.
function segmentsCross(a1: LatLng, a2: LatLng, b1: LatLng, b2: LatLng): boolean {
  const d1 = cross(a1, a2, b1)
  const d2 = cross(a1, a2, b2)
  const d3 = cross(b1, b2, a1)
  const d4 = cross(b1, b2, a2)
  return d1 * d2 < 0 && d3 * d4 < 0
}

function selfIntersects(ring: LatLng[]): boolean {
  const n = ring.length
  if (n < 4) return false
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const adjacent = j === i + 1 || (i === 0 && j === n - 1)
      if (adjacent) continue
      if (segmentsCross(ring[i], ring[(i + 1) % n], ring[j], ring[(j + 1) % n])) return true
    }
  }
  return false
}

export function shapeIssue(ring: LatLng[], maxAreaHa?: number): ShapeIssue | null {
  if (ring.length === 2) return 'open'
  if (selfIntersects(ring)) return 'crossing'
  if (ring.length < 3) return null
  const areaHa = ringAreaHa(ring)
  if (areaHa === 0) return 'flat'
  if (maxAreaHa != null && areaHa > maxAreaHa) return 'large'
  return null
}

function isClockwise(ring: LatLng[]): boolean {
  let sum = 0
  for (let i = 0; i < ring.length; i++) {
    const a = ring[i]
    const b = ring[(i + 1) % ring.length]
    sum += (b.lng - a.lng) * (b.lat + a.lat)
  }
  return sum > 0
}

export function polygonsOf(geometry: Geometry | null): Position[][][] {
  if (geometry?.type === 'Polygon') return [geometry.coordinates]
  if (geometry?.type === 'MultiPolygon') return geometry.coordinates
  return []
}

// Leaflet reports longitudes beyond ±180 when the map is panned onto a repeated world copy.
const wrapLng = (lng: number) => ((((lng + 180) % 360) + 360) % 360) - 180

const toPosition = ({ lat, lng }: LatLng): Position => [round6(wrapLng(lng)), round6(lat)]

const toLatLng = ([lng, lat]: Position): LatLng => ({ lat, lng })

export const geometryAreaHa = (geometry: Geometry | null) =>
  polygonsOf(geometry).reduce((sum, [exterior]) => sum + ringAreaHa(exterior.map(toLatLng)), 0)

export function toLatLngs(geometry: EditableGeometry): LatLng[] {
  if (geometry.type === 'Point') return [toLatLng(geometry.coordinates)]
  const [[exterior]] = polygonsOf(geometry)
  const [first, last] = [exterior[0], exterior[exterior.length - 1]]
  // Some exporters leave rings unclosed; dropping the last position there would lose a real vertex.
  const closed = first[0] === last[0] && first[1] === last[1]
  return (closed ? exterior.slice(0, -1) : exterior).map(toLatLng)
}

export function toGeometry(vertices: LatLng[], type?: EditableGeometry['type']): EditableGeometry {
  if (vertices.length === 1) return { type: 'Point', coordinates: toPosition(vertices[0]) }

  // RFC 7946 expects exterior rings to run counterclockwise.
  const ring = (isClockwise(vertices) ? [...vertices].reverse() : vertices).map(toPosition)
  const polygon = [[...ring, ring[0]]]
  return type === 'MultiPolygon' ? { type, coordinates: [polygon] } : { type: 'Polygon', coordinates: polygon }
}

const COORD_PAIR = /^\s*(-?\d+(?:\.\d+)?)\s*[,\s]\s*(-?\d+(?:\.\d+)?)\s*$/

export function parseLatLng(input: string): LatLng | null {
  const match = COORD_PAIR.exec(input)
  if (!match) return null
  const lat = Number(match[1])
  const lng = Number(match[2])
  return inRange(lat, lng) ? { lat, lng } : null
}
