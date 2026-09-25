'use client'

import { useCallback, useRef, useState } from 'react'
import type { LatLng } from './geometry'

export interface Vertex extends LatLng {
  id: number
}

/** History is the point list at each step: undo drops points, it does not replay edits. */
export function useVertices(initial: Vertex[] = []) {
  const [history, setHistory] = useState<Vertex[][]>([initial])
  const nextId = useRef(initial.reduce((max, vertex) => Math.max(max, vertex.id), -1) + 1)

  const vertices = history[history.length - 1]

  const commit = useCallback((next: Vertex[]) => setHistory((h) => [...h, next]), [])

  const add = useCallback(
    (point: LatLng) => commit([...vertices, { ...point, id: nextId.current++ }]),
    [commit, vertices]
  )

  const remove = useCallback(
    (id: number) => commit(vertices.filter((v) => v.id !== id)),
    [commit, vertices]
  )

  // Dragging edits the current step rather than adding one per pointer move.
  const move = useCallback((id: number, point: LatLng) => {
    setHistory((h) => [...h.slice(0, -1), h[h.length - 1].map((v) => (v.id === id ? { ...v, ...point } : v))])
  }, [])

  const clear = useCallback(() => commit([]), [commit])

  const undo = useCallback(() => setHistory((h) => (h.length > 1 ? h.slice(0, -1) : h)), [])

  return { vertices, add, remove, move, clear, undo, canUndo: history.length > 1 }
}
