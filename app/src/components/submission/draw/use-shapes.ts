'use client'

import { useRef, useState } from 'react'
import type { LatLng } from '@/lib/draw/geometry'
import type { Shape } from '@/lib/draw/geojson'

interface Snapshot {
  shapes: Shape[]
  activeId: number | null
}

const withVertices = ({ shapes, activeId }: Snapshot, update: (vertices: LatLng[]) => LatLng[]) =>
  shapes.map((shape) => (shape.id === activeId ? { ...shape, vertices: update(shape.vertices) } : shape))

export function useShapes(initial: Shape[]) {
  const [history, setHistory] = useState<Snapshot[]>([{ shapes: initial, activeId: null }])
  const nextId = useRef(initial.reduce((max, shape) => Math.max(max, shape.id), -1) + 1)
  const current = history[history.length - 1]
  const active = current.shapes.find((shape) => shape.id === current.activeId)

  const commit = (next: Snapshot) => setHistory((h) => [...h, next])

  const replaceLatest = (update: (latest: Snapshot) => Snapshot) =>
    setHistory((h) => [...h.slice(0, -1), update(h[h.length - 1])])

  const add = (point: LatLng) => {
    if (active) {
      commit({ ...current, shapes: withVertices(current, (vertices) => [...vertices, point]) })
      return
    }
    const shape = { id: nextId.current++, vertices: [point] }
    commit({ activeId: shape.id, shapes: [...current.shapes, shape] })
  }

  const removeActive = () => commit({ activeId: null, shapes: current.shapes.filter((shape) => shape !== active) })

  const remove = (index: number) => {
    if (active?.vertices.length === 1) removeActive()
    else commit({ ...current, shapes: withVertices(current, (vertices) => vertices.filter((_, i) => i !== index)) })
  }

  const startMove = () => commit(current)

  const move = (index: number, point: LatLng) =>
    replaceLatest((latest) => ({
      ...latest,
      shapes: withVertices(latest, (vertices) => vertices.map((vertex, i) => (i === index ? point : vertex))),
    }))

  const select = (id: number | null) => replaceLatest((latest) => ({ ...latest, activeId: id }))

  const undo = () => setHistory((h) => (h.length > 1 ? h.slice(0, -1) : h))

  return {
    shapes: current.shapes,
    active,
    add,
    remove,
    startMove,
    move,
    select,
    removeActive,
    undo,
    canUndo: history.length > 1,
  }
}
