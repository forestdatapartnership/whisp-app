import type { Feature, Geometry, Position } from 'geojson'

type Coordinates = Position | Coordinates[]

const TYPES: Record<string, Exclude<Geometry['type'], 'GeometryCollection'>> = {
  POINT: 'Point',
  MULTIPOINT: 'MultiPoint',
  LINESTRING: 'LineString',
  MULTILINESTRING: 'MultiLineString',
  POLYGON: 'Polygon',
  MULTIPOLYGON: 'MultiPolygon',
}

// Collections and multipoints become one feature per geometry, matching how the API reads WKT.
export function wktToFeatures(wkt: string): Feature[] {
  const tokens = wkt.match(/[a-z]+|[-+.\d][-+.\de]*|[(),]/gi) ?? []
  let i = 0

  const take = (expected?: string) => {
    const token = tokens[i++]
    if (expected !== undefined && token !== expected) throw new SyntaxError(`WKT: expected ${expected}`)
    return token
  }

  const coordinates = (): Coordinates => {
    if (tokens[i] !== '(') {
      const position: Position = []
      while (i < tokens.length && !['(', ')', ','].includes(tokens[i])) position.push(Number(take()))
      return position
    }
    take('(')
    const items: Coordinates[] = [coordinates()]
    while (tokens[i] === ',') {
      take()
      items.push(coordinates())
    }
    take(')')
    return items
  }

  const geometries = (): Geometry[] => {
    const name = take().toUpperCase()
    if (/^(Z|M|ZM)$/i.test(tokens[i])) take()
    if (name === 'GEOMETRYCOLLECTION') {
      take('(')
      const members = geometries()
      while (tokens[i] === ',') {
        take()
        members.push(...geometries())
      }
      take(')')
      return members
    }
    const type = TYPES[name]
    if (!type) throw new SyntaxError(`WKT: unsupported type ${name}`)
    const coords = coordinates() as Coordinates[]
    if (type === 'Point') return [{ type, coordinates: coords[0] as Position }]
    if (type === 'MultiPoint') {
      return coords.map((point): Geometry => ({
        type: 'Point',
        coordinates: (Array.isArray(point[0]) ? point[0] : point) as Position,
      }))
    }
    return [{ type, coordinates: coords } as Geometry]
  }

  const result = geometries()
  if (i !== tokens.length) throw new SyntaxError('WKT: unexpected trailing text')
  return result.map((geometry) => ({ type: 'Feature', properties: {}, geometry }))
}
