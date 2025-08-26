import { useState, useEffect, useCallback, useRef } from 'react'
import { StatusResponse } from '@/types/api'

export function useStatusPolling(options: {
  id: string
  maxRetries?: number
  baseDelay?: number
  onCompleted?: (resultUrl?: string) => void
}) {
  const {
    id,
    maxRetries = 10,
    baseDelay = 2000,
    onCompleted
  } = options

  const [status, setStatus] = useState<StatusResponse | null>(null)
  const [retryCount, setRetryCount] = useState<number>(0)

  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  const getDelay = useCallback((attempt: number): number => {
    return Math.min(baseDelay * Math.pow(2, attempt), 10000)
  }, [baseDelay])

  const checkStatus = useCallback(async (): Promise<StatusResponse> => {
    try {
      const response = await fetch(`/api/status/${id}`)
      const data: StatusResponse = await response.json()
      return data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
      throw new Error(`Failed to check status: ${errorMessage}`)
    }
  }, [id])

  const handleStatusChange = useCallback((newStatus: StatusResponse) => {
    setStatus(newStatus)

    if (newStatus.status === 'completed' && onCompleted && newStatus.resultUrl) {
      onCompleted(newStatus.resultUrl)
    }
  }, [onCompleted])

  const stopPolling = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
  }, [])

  const setFailed = useCallback((errorMessage: string) => {
    const failedStatus: StatusResponse = {
      status: 'failed',
      error: errorMessage
    }
    setStatus(failedStatus)
  }, [])

  const startPolling = useCallback(() => {
    setRetryCount(0)

    const poll = async (attempt = 0) => {
      try {
        const newStatus = await checkStatus()
        handleStatusChange(newStatus)
        setRetryCount(0)

        if (newStatus.status === 'processing' && attempt < maxRetries) {
          const delay = getDelay(attempt)
          timeoutRef.current = setTimeout(() => poll(attempt + 1), delay)
        } else {
          stopPolling()
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error'

        const newAttempt = attempt + 1
        setRetryCount(newAttempt)

        if (newAttempt <= maxRetries) {
          const delay = getDelay(attempt)
          timeoutRef.current = setTimeout(() => poll(newAttempt), delay)
        } else {
          const failedStatus: StatusResponse = {
            status: 'failed',
            error: errorMessage
          }
          setStatus(failedStatus)
          stopPolling()
        }
      }
    }

    poll(0)
  }, [id, maxRetries, checkStatus, handleStatusChange, getDelay])

  useEffect(() => {
    return () => {
      stopPolling()
    }
  }, [])

  useEffect(() => {
    if (id) {
      startPolling()
    } else {
      stopPolling()
    }

    return () => stopPolling()
  }, [id])

  return {
    status,
    retryCount,
    stopPolling,
    startPolling,
    setFailed
  } as const
}
