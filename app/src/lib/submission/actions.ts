'use server'

import { action } from '@/lib/server/action'
import { config } from '@/lib/server/env'
import type { CollectionInfo } from '@/types/asset-registry'

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
