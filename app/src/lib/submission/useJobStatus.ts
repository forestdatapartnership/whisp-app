'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useConfig } from '@/lib/config/config-context'

const POLL_INTERVAL = 5000

export interface JobStatus {
  code: string
  message?: string
  data?: Record<string, unknown>
  cause?: string
  final?: boolean
}

const TERMINAL = new Set(['analysis_completed', 'analysis_error', 'analysis_timeout', 'analysis_cancelled'])

export function useJobStatus({
  token,
  onCompleted,
}: {
  token: string | null
  onCompleted?: (data: unknown) => void
}) {
  const [response, setResponse] = useState<JobStatus | null>(null)
  const [fallback, setFallback] = useState(false)
  const completedRef = useRef(false)
  const apiUrl = useConfig().config?.api.url

  const handleCompleted = useCallback((data: unknown) => {
    if (!completedRef.current) {
      completedRef.current = true
      onCompleted?.(data)
    }
  }, [onCompleted])

  useEffect(() => {
    if (!token || !apiUrl || completedRef.current || fallback) return

    const controller = new AbortController()
    // Some proxies hold a stream back until it ends; waiting longer than a poll interval is slower than polling
    const timeout = setTimeout(() => { controller.abort(); setFallback(true) }, POLL_INTERVAL)

    const run = async () => {
      try {
        const res = await fetch(`/internal/status/${token}/stream`, {
          signal: controller.signal,
        })
        clearTimeout(timeout)
        if (!res.ok || !res.body) { setFallback(true); return }

        const reader = res.body.getReader()
        const decoder = new TextDecoder()
        let buffer = ''

        while (true) {
          const { done, value } = await reader.read()
          // A proxy or a restart can close the stream before its final event
          if (done) { setFallback(true); return }
          buffer += decoder.decode(value, { stream: true })
          let idx: number
          while ((idx = buffer.indexOf('\n\n')) !== -1) {
            const chunk = buffer.slice(0, idx)
            buffer = buffer.slice(idx + 2)
            const line = chunk.trim()
            if (!line.startsWith('data:')) continue
            const json = line.slice(5).trim()
            if (!json) continue
            const data: JobStatus = JSON.parse(json)
            if (data.code === 'analysis_completed') {
              const result = await fetch(new URL(data.data?.resultsUrl as string, apiUrl), { signal: controller.signal })
              if (!result.ok) throw new Error(`Results request failed: ${result.status}`)
              handleCompleted(await result.json())
            }
            setResponse(data)
            if (data.final) { controller.abort(); return }
          }
        }
      } catch {
        if (!controller.signal.aborted) setFallback(true)
      }
    }

    run()
    return () => { clearTimeout(timeout); controller.abort() }
  }, [token, apiUrl, handleCompleted, fallback])

  useEffect(() => {
    if (!token || !fallback) return

    let timer: ReturnType<typeof setTimeout> | undefined
    let stopped = false

    // A completed job returns its whole result, which can take longer than the interval to download
    const poll = async () => {
      try {
        const res = await fetch(`/internal/status/${token}`)
        const json: JobStatus = await res.json()
        setResponse(json)
        if (json.code === 'analysis_completed') {
          handleCompleted(json.data)
          return
        }
        if (TERMINAL.has(json.code)) return
      } catch { /* retry next interval */ }
      if (!stopped) timer = setTimeout(poll, POLL_INTERVAL)
    }

    poll()
    return () => {
      stopped = true
      clearTimeout(timer)
    }
  }, [token, fallback, handleCompleted])

  const isLoading = !!token && !response
  return { response, isLoading } as const
}
