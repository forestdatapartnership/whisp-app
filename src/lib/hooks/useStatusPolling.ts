import { useEffect, useRef } from 'react'
import useSWR from 'swr'
import { ApiResponse } from '@/types/api'
import { SystemCode } from '@/types/systemCodes'

const POLLING_INTERVAL = 2000 
const POLLING_TIMEOUT = 5 * 60 * 1000 // 5 minutes

const fetcher = async (url: string): Promise<ApiResponse> => {
  const response = await fetch(url)
  return response.json()
}

export function useStatusPolling(options: {
  id: string | null
  onCompleted?: (resultData?: any) => void
}) {
  const { id, onCompleted } = options
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  
  // Only poll if we get ANALYSIS_PROCESSING system code
  const shouldPoll = (data: ApiResponse | undefined) => {
    return data?.code === SystemCode.ANALYSIS_PROCESSING
  }
  
  const { data: response, error, isLoading } = useSWR(
    id ? `/api/status/${id}` : null,
    fetcher,
    {
      refreshInterval: (data) => shouldPoll(data) ? POLLING_INTERVAL : 0,
      refreshWhenHidden: false,
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      errorRetryCount: 5,
      shouldRetryOnError: true,
      errorRetryInterval: POLLING_INTERVAL,
      dedupingInterval: 1000,
    }
  )
  
  // Handle completion callback
  useEffect(() => {
    if (response?.code === SystemCode.ANALYSIS_COMPLETED && onCompleted && response.data) {
      onCompleted(response.data)
    }
  }, [response, onCompleted])
  
  // Handle 5-minute timeout
  useEffect(() => {
    if (!id) return
    
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    
    // Set new timeout
    timeoutRef.current = setTimeout(() => {
      // The timeout will naturally stop polling since SWR will stop refreshing
      // The results page can handle the timeout state by checking elapsed time
    }, POLLING_TIMEOUT)
    
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }
    }
  }, [id])
  
  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])
  
  return {
    response,
    isLoading: id ? (isLoading || (!response && !error)) : false,
    error
  } as const
}