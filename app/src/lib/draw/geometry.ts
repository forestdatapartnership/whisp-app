import type { FeatureCollection, Geometry } from 'geojson'

export interface LatLng {
  lat: number
  lng: number
}

const EARTH_RADIUS_M = 6378137
const SQM_PER_HA = 10_000

const toRad = (deg: number) => (deg * Math.PI) / 180

// EUDR requires at least six decimals; rounding to six also trims the payload.
const round6 = (n: number) => Math.round(n * 1e6) / 1e6

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

// Proper crossings only: segments that merely touch at a shared endpoint are not
// intersections, and flagging them would reject legitimate rings.
function segmentsCross(a1: LatLng, a2: LatLng, b1: LatLng, b2: LatLng): boolean {
  const d1 = cross(a1, a2, b1)
  const d2 = cross(a1, a2, b2)
  const d3 = cross(b1, b2, a1)
  const d4 = cross(b1, b2, a2)
  return ((d1 > 0) !== (d2 > 0)) && ((d3 > 0) !== (d4 > 0))
}

export function selfIntersects(ring: LatLng[]): boolean {
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

function isClockwise(ring: LatLng[]): boolean {
  let sum = 0
  for (let i = 0; i < ring.length; i++) {
    const a = ring[i]
    const b = ring[(i + 1) % ring.length]
    sum += (b.lng - a.lng) * (b.lat + a.lat)
  }
  return sum > 0
}

export function isValidPlot(count: number, crossing: boolean, areaHa: number): boolean {
  return count === 1 || (count >= 3 && !crossing && areaHa > 0)
}

export function toFeatureCollection(vertices: LatLng[]): FeatureCollection | null {
  if (!isValidPlot(vertices.length, selfIntersects(vertices), ringAreaHa(vertices))) return null

  if (vertices.length === 1) {
    const { lat, lng } = vertices[0]
    return wrap({ type: 'Point', coordinates: [round6(lng), round6(lat)] })
  }

  const ring = isClockwise(vertices) ? [...vertices].reverse() : vertices
  const coordinates = ring.map((v) => [round6(v.lng), round6(v.lat)])
  coordinates.push(coordinates[0])
  return wrap({ type: 'Polygon', coordinates: [coordinates] })
}

function wrap(geometry: Geometry): FeatureCollection {
  return {
    type: 'FeatureCollection',
    features: [{ type: 'Feature', geometry, properties: {} }],
  }
}

const COORD_PAIR = /^\s*(-?\d+(?:\.\d+)?)\s*[,\s]\s*(-?\d+(?:\.\d+)?)\s*$/

export function parseLatLng(input: string): LatLng | null {
  const match = COORD_PAIR.exec(input)
  if (!match) return null
  const lat = Number(match[1])
  const lng = Number(match[2])
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null
  return { lat, lng }
}
