import { toFeatureCollection, type LatLng } from './geometry'

export function downloadPlot(vertices: LatLng[]) {
  const geojson = toFeatureCollection(vertices)
  if (!geojson) return

  const url = URL.createObjectURL(
    new Blob([JSON.stringify(geojson, null, 2)], { type: 'application/geo+json' })
  )
  const a = document.createElement('a')
  a.href = url
  a.download = 'whisp_plot.geojson'
  a.click()
  // Revoking synchronously can cancel the download in some browsers.
  setTimeout(() => URL.revokeObjectURL(url), 0)
}
