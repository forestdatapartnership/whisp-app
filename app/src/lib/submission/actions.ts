'use server'

import { action } from '@/lib/server/action'
import { apiFetch } from '@/lib/server/api-client'
import { config } from '@/lib/server/env'
import type { CollectionInfo } from '@/types/asset-registry'

export type SubmitEndpoint = 'wkt' | 'geojson' | 'geo-ids'

export type ApiEnvelope = {
  code: string
  message?: string
  data?: Record<string, unknown>
  context?: Record<string, unknown>
  cause?: string
}

export const fetchCollections = action(async (): Promise<CollectionInfo[]> => {
  const url = await config.geoid.collectionsUrl()
  if (!url) return []
  const res = await fetch(url, { next: { revalidate: 300 } })
  if (!res.ok) return []
  const data: { collections?: Array<{ id: string; title?: string; description?: string }> } = await res.json()
  return (data.collections ?? []).map((c) => ({
    id: c.id,
    title: c.title ?? null,
    description: c.description ?? null,
  }))
})

export const submitAnalysis = action(async (endpoint: SubmitEndpoint, body: unknown) => {
  const res = await apiFetch(`/submit/${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  return { status: res.status, body: (await res.json()) as ApiEnvelope }
})
