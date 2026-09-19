type FileErrorKey = 'readError' | 'empty' | 'invalidGeoJson' | 'unsupportedFormat' | 'noGeoIds'

export type ParseResult =
  | { wkt: string; featureCount: number }
  | { json: Record<string, unknown>; featureCount: number }
  | { error: FileErrorKey }

export function parseGeometryFile(file: File): Promise<ParseResult> {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target?.result
      if (typeof text !== 'string') {
        resolve({ error: 'readError' })
        return
      }

      if (file.name.endsWith('.txt')) {
        const trimmed = text.trim()
        if (!trimmed) {
          resolve({ error: 'empty' })
          return
        }
        const featureCount = countWktFeatures(trimmed)
        resolve({ wkt: trimmed, featureCount })
      } else if (file.name.endsWith('.json') || file.name.endsWith('.geojson')) {
        try {
          const jsonData = JSON.parse(text)
          let featureCount = 1
          if (jsonData.type === 'FeatureCollection' && Array.isArray(jsonData.features)) {
            featureCount = jsonData.features.length
          }
          resolve({ json: jsonData, featureCount })
        } catch {
          resolve({ error: 'invalidGeoJson' })
        }
      } else {
        resolve({ error: 'unsupportedFormat' })
      }
    }
    reader.onerror = () => resolve({ error: 'readError' })
    reader.readAsText(file)
  })
}

export function parseGeoIdText(text: string): string[] {
  return text.split(/[\n,]/).map((l) => l.trim()).filter(Boolean)
}

export function parseGeoIdFile(file: File): Promise<string[] | { error: FileErrorKey }> {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target?.result
      if (typeof text !== 'string') { resolve({ error: 'readError' }); return }
      const ids = parseGeoIdText(text)
      if (ids.length === 0) { resolve({ error: 'noGeoIds' }); return }
      resolve(ids)
    }
    reader.onerror = () => resolve({ error: 'readError' })
    reader.readAsText(file)
  })
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
