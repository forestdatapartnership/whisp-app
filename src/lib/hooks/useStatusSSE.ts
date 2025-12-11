import { useEffect, useRef, useState, useCallback } from 'react'
import { ApiResponse } from '@/types/api'
import { SystemCode } from '@/types/systemCodes'

export function useStatusSSE(options: {
  id: string | null
  onCompleted?: (resultData?: any) => void
}) {
  const { id, onCompleted } = options
  const [response, setResponse] = useState<ApiResponse | null>(null)
  const [error, setError] = useState<Error | null>(null)
  const eventSourceRef = useRef<EventSource | null>(null)
  const completedRef = useRef(false)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const maxDurationRef = useRef<NodeJS.Timeout | null>(null)

  const handleCompleted = useCallback((data: any) => {
    if (!completedRef.current) {
      completedRef.current = true
      onCompleted?.(data)
    }
  }, [onCompleted])

  useEffect(() => {
    if (!id || completedRef.current) return

    eventSourceRef.current = new EventSource(`/api/status/${id}/stream`)
    const es = eventSourceRef.current
    const clearTimer = (ref: React.MutableRefObject<NodeJS.Timeout | null>) => {
      if (ref.current) {
        clearTimeout(ref.current)
        ref.current = null
      }
    }
    timeoutRef.current = setTimeout(() => {
      setError(new Error('SSE timeout'))
      es.close()
    }, 10000)
    maxDurationRef.current = setTimeout(() => {
      setError(new Error('SSE max duration reached'))
      es.close()
    }, 60000)

    es.onmessage = (e) => {
      clearTimer(timeoutRef)
      const data = JSON.parse(e.data)
      setResponse(data)
      if (data.code === SystemCode.ANALYSIS_COMPLETED) {
        clearTimer(maxDurationRef)
        handleCompleted(data.data)
        es.close()
      } else if (data.final) {
        clearTimer(maxDurationRef)
        es.close()
      }
    }

    es.onerror = () => {
      setError(new Error('SSE connection failed'))
      clearTimer(timeoutRef)
      clearTimer(maxDurationRef)
      es.close()
    }

    return () => {
      es.close()
      clearTimer(timeoutRef)
      clearTimer(maxDurationRef)
    }
  }, [id, handleCompleted])

  useEffect(() => {
    return () => eventSourceRef.current?.close()
  }, [])

  return {
    response,
    isLoading: id ? !response && !error : false,
    error
  } as const
}

