'use client'

import { LayersControl, TileLayer } from 'react-leaflet'
import { useTranslations } from 'next-intl'
import { useTheme } from '@/components/layout/theme-provider'
import { useConfig } from '@/lib/config/config-context'

const OSM_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
const OSM = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
const CARTO = `${OSM} &copy; <a href="https://carto.com/attributions">CARTO</a>`

const CARTO_TILES = {
  dark: { url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', attribution: CARTO },
  light: { url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', attribution: CARTO },
} as const

// Each source stops at its own native level; overzooming upscales those tiles so the
// map keeps rendering instead of going blank.
const MAX_ZOOM = 21

// Domain-locked and sent in browser tile requests, so the key is public by design.
const withKey = (url: string, key?: string) => (key ? `${url}?key=${encodeURIComponent(key)}` : url)

export function BaseLayers({ defaultLayer = 'map' }: { defaultLayer?: 'map' | 'satellite' }) {
  const t = useTranslations('Map')
  const { theme } = useTheme()
  const { config } = useConfig()
  const cartoKey = config?.map.cartoKey
  const carto = CARTO_TILES[theme]

  return (
    <LayersControl key={`${theme}-${cartoKey ? 'keyed' : 'unkeyed'}`} position="topright">
      <LayersControl.BaseLayer checked={defaultLayer === 'map'} name={t('layerMap')}>
        <TileLayer
          url={withKey(carto.url, cartoKey)}
          attribution={carto.attribution}
          maxNativeZoom={20}
          maxZoom={MAX_ZOOM}
        />
      </LayersControl.BaseLayer>

      <LayersControl.BaseLayer checked={defaultLayer === 'satellite'} name={t('layerSatellite')}>
        <TileLayer
          url="https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}"
          attribution='&copy; <a href="https://www.google.com/maps">Google Maps</a>'
          maxNativeZoom={18}
          maxZoom={MAX_ZOOM}
        />
      </LayersControl.BaseLayer>

      <LayersControl.BaseLayer name={t('layerStreet')}>
        <TileLayer url={OSM_URL} attribution={OSM} maxNativeZoom={19} maxZoom={MAX_ZOOM} />
      </LayersControl.BaseLayer>
    </LayersControl>
  )
}
