type FileErrorKey = 'readError' | 'empty' | 'invalidGeoJson' | 'unsupportedFormat' | 'noGeoIds'

export type FileTextResult = string | { error: FileErrorKey }

type GeometryParseResult =
  | { wkt: string; featureCount: number }
  | { json: Record<string, unknown>; featureCount: number }
  | { error: FileErrorKey }

function readTextFile(file: File): Promise<FileTextResult> {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target?.result
      resolve(typeof text === 'string' ? text : { error: 'readError' })
    }
    reader.onerror = () => resolve({ error: 'readError' })
    reader.readAsText(file)
  })
}

export function parseGeometryText(text: string): GeometryParseResult {
  const trimmed = text.trim()
  if (!trimmed) return { error: 'empty' }
  if (!trimmed.startsWith('{')) return { wkt: trimmed, featureCount: countWktFeatures(trimmed) }
  try {
    const json = JSON.parse(trimmed)
    const featureCount = json.type === 'FeatureCollection' && Array.isArray(json.features) ? json.features.length : 1
    return { json, featureCount }
  } catch {
    return { error: 'invalidGeoJson' }
  }
}

// The API only accepts an external ID column that every feature has.
export function commonPropertyNames(json: Record<string, unknown>): string[] {
  const features: unknown[] = json.type === 'Feature' ? [json] : Array.isArray(json.features) ? json.features : []
  let common: string[] | null = null
  for (const feature of features) {
    const keys = new Set(Object.keys((feature as { properties?: object | null } | null)?.properties ?? {}))
    common = common ? common.filter((key) => keys.has(key)) : [...keys]
    if (common.length === 0) break
  }
  return (common ?? []).sort()
}

export async function readGeometryFile(file: File): Promise<FileTextResult> {
  if (!/\.(txt|json|geojson)$/i.test(file.name)) return { error: 'unsupportedFormat' }
  const text = await readTextFile(file)
  if (typeof text !== 'string') return text
  const result = parseGeometryText(text)
  if ('wkt' in result && !/\.txt$/i.test(file.name)) return { error: 'invalidGeoJson' }
  return 'error' in result ? result : text.trim()
}

export function parseGeoIdText(text: string): string[] {
  return text.split(/[\n,]/).map((l) => l.trim()).filter(Boolean)
}

export async function readGeoIdFile(file: File): Promise<FileTextResult> {
  const text = await readTextFile(file)
  if (typeof text !== 'string') return text
  const ids = parseGeoIdText(text)
  return ids.length > 0 ? ids.join('\n') : { error: 'noGeoIds' }
}

function countWktFeatures(wkt: string): number {
  const normalized = wkt.replace(/\s+/g, ' ').trim().toUpperCase()
  if (normalized.startsWith('GEOMETRYCOLLECTION')) {
    const match = normalized.match(/\((.+)\)\s*$/)
    if (match) {
      const inner = match[1]
      const geoms = inner.match(/[A-Z]+\s*\(/g)
      return geoms ? geoms.length : 1
    }
  }
  if (normalized.startsWith('MULTI')) {
    const match = normalized.match(/\(\((.+)\)\)\s*$/)
    if (match) {
      const inner = match[1]
      const parts = inner.split(/\),\s*\(/)
      return parts.length
    }
  }
  return 1
}
