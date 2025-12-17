import { useEffect, useRef, useState, useCallback } from 'react'
import { ApiResponse } from '@/types/api'
import { SystemCode } from '@/types/systemCodes'
import { useStatusPolling } from './useStatusPolling'

export function useStatusSSE(options: {
  id: string | null
  apiKey?: string | null
  onCompleted?: (resultData?: any) => void
}) {
  const { id, apiKey, onCompleted } = options
  const [response, setResponse] = useState<ApiResponse | null>(null)
  const [error, setError] = useState<Error | null>(null)
  const [fallback, setFallback] = useState(false)
  const completedRef = useRef(false)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const maxDurationRef = useRef<NodeJS.Timeout | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  const handleCompleted = useCallback((data: any) => {
    if (!completedRef.current) {
      completedRef.current = true
      onCompleted?.(data)
    }
  }, [onCompleted])

  useEffect(() => {
    if (!id || completedRef.current || fallback) return

    const clearTimer = (ref: React.MutableRefObject<NodeJS.Timeout | null>) => {
      if (ref.current) {
        clearTimeout(ref.current)
        ref.current = null
      }
    }

    const controller = new AbortController()
    abortRef.current = controller
    timeoutRef.current = setTimeout(() => {
      setError(new Error('SSE timeout'))
      controller.abort()
    }, 10000)
    maxDurationRef.current = setTimeout(() => {
      setError(new Error('SSE max duration reached'))
      controller.abort()
    }, 60000)

    const run = async () => {
      try {
        const res = await fetch(`/api/status/${id}/stream`, {
          headers: apiKey ? { 'x-api-key': apiKey } : undefined,
          signal: controller.signal
        })
        if (!res.ok) {
          setError(new Error(`SSE failed ${res.status}`))
          setFallback(true)
          return
        }
        if (!res.body) {
          setError(new Error('No stream'))
          setFallback(true)
          return
        }
        const reader = res.body.getReader()
        const decoder = new TextDecoder()
        let buffer = ''

        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          buffer += decoder.decode(value, { stream: true })
          let idx
          while ((idx = buffer.indexOf('\n\n')) !== -1) {
            const chunk = buffer.slice(0, idx)
            buffer = buffer.slice(idx + 2)
            const line = chunk.trim()
            if (!line.startsWith('data:')) continue
            const json = line.slice(5).trim()
            if (!json) continue
            const data = JSON.parse(json)
            clearTimer(timeoutRef)
            setResponse(data)
            if (data.code === SystemCode.ANALYSIS_COMPLETED) {
              clearTimer(maxDurationRef)
              handleCompleted(data.data)
              controller.abort()
              return
            }
            if (data.final) {
              clearTimer(maxDurationRef)
              controller.abort()
              return
            }
          }
        }
      } catch (err: any) {
        if (controller.signal.aborted) return
        setError(err instanceof Error ? err : new Error('SSE connection failed'))
        setFallback(true)
      } finally {
        clearTimer(timeoutRef)
        clearTimer(maxDurationRef)
      }
    }

    run()

    return () => {
      controller.abort()
      clearTimer(timeoutRef)
      clearTimer(maxDurationRef)
    }
  }, [id, apiKey, handleCompleted, fallback])

  useEffect(() => {
    return () => {
      abortRef.current?.abort()
    }
  }, [])

  const polling = useStatusPolling({
    id: fallback ? id : null,
    apiKey: apiKey || undefined,
    onCompleted
  })

  return {
    response: response || polling.response,
    isLoading: id ? (!response && !error && !fallback) || polling.isLoading : false,
    error: fallback ? polling.error : error
  } as const
}

