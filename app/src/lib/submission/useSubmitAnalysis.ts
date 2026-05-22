'use client'

import { useCallback, useState } from 'react'
import { useRouter } from 'next/navigation'
import { submitAnalysis } from '@/lib/submission/actions'
import { storeSyncResult } from '@/lib/submission/sync-result'
import { formatSystemMessage } from '@/types/system-codes'
import type { AnalysisOptionsValue } from '@/components/submission/analysis-options'

export type GeoPayload =
  | { type: 'wkt'; wkt: string }
  | { type: 'json'; geojson: Record<string, unknown> }

export type SubmitPayload =
  | { type: 'geometry'; payload: GeoPayload }
  | { type: 'geo-ids'; geoIds: string[]; collection?: string }

export function useSubmitAnalysis({
  analysisOptions,
  featureCount,
  asyncThreshold = 50,
}: {
  analysisOptions: AnalysisOptionsValue
  featureCount: number
  asyncThreshold?: number
}) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const submit = useCallback(
    async (params: SubmitPayload) => {
      setError('')
      const mergedOptions = { ...analysisOptions, async: featureCount > asyncThreshold }

      let endpoint: 'wkt' | 'geojson' | 'geo-ids'
      let body: unknown

      if (params.type === 'geometry') {
        const p = params.payload
        endpoint = p.type === 'wkt' ? 'wkt' : 'geojson'
        body =
          p.type === 'wkt'
            ? { wkt: p.wkt, analysisOptions: mergedOptions }
            : { ...p.geojson, analysisOptions: mergedOptions }
      } else {
        endpoint = 'geo-ids'
        body = {
          geoIds: params.geoIds,
          analysisOptions: mergedOptions,
          ...(params.collection && { geoidOptions: { collection: params.collection } }),
        }
      }

      setIsLoading(true)
      try {
        const result = await submitAnalysis(endpoint, body)
        if (!result.ok) {
          setError(formatSystemMessage(result.code, result.args))
          return
        }
        const { status, body: data } = result.data
        if (status >= 400) {
          setError(data.message ?? `Error ${status}`)
          return
        }
        let token: string | undefined
        if (data.code === 'analysis_queued' || data.code === 'analysis_processing') {
          token = data.data?.token as string | undefined
        } else if (data.code === 'analysis_completed') {
          token = data.context?.token as string | undefined
          if (token && data.data) storeSyncResult(token, data.data)
        }
        if (token) router.push(`/results/${token}`)
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : 'Submission failed')
      } finally {
        setIsLoading(false)
      }
    },
    [analysisOptions, featureCount, asyncThreshold, router]
  )

  return { submit, isLoading, error, setError }
}
