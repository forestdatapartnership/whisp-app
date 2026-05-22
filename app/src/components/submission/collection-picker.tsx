'use client'

import { useEffect, useRef, useState } from 'react'
import { RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useConfig } from '@/lib/config/config-context'
import { fetchCollections } from '@/lib/submission/actions'
import type { CollectionInfo } from '@/types/asset-registry'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'

interface CollectionPickerProps {
  value: string
  onChange: (value: string) => void
}

export function CollectionPicker({ value, onChange }: CollectionPickerProps) {
  const { config } = useConfig()
  const [collections, setCollections] = useState<CollectionInfo[]>([])
  const [loading, setLoading] = useState(false)
  const initialized = useRef(false)
  const onChangeRef = useRef(onChange)

  useEffect(() => {
    onChangeRef.current = onChange
  })

  useEffect(() => {
    setLoading(true)
    fetchCollections()
      .then((result) => {
        if (!result.ok) return
        const data = result.data
        setCollections(data)
        if (!initialized.current) {
          initialized.current = true
          const def = config?.geoidDefaultCollection
            ? (data.find((c) => c.id === config.geoidDefaultCollection) ?? data[0])
            : data[0]
          if (def && !value) onChangeRef.current(def.id)
        }
      })
      .finally(() => setLoading(false))
  }, [config, value])

  const reload = () => {
    setLoading(true)
    fetchCollections()
      .then((result) => {
        if (!result.ok) return
        setCollections(result.data)
      })
      .finally(() => setLoading(false))
  }

  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[11px] font-medium uppercase tracking-wider text-text-muted">Collection</span>
      <div className="flex items-center gap-2">
        <Select value={value} onValueChange={(v) => v && onChange(v)} disabled={loading}>
          <SelectTrigger className="flex-1 w-full">
            <SelectValue placeholder={loading ? 'Loading…' : 'Select a collection…'} />
          </SelectTrigger>
          <SelectContent>
            {collections.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.id}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          type="button"
          variant="outline"
          size="icon-sm"
          onClick={reload}
          disabled={loading}
          title="Refresh collections"
        >
          <RefreshCw className={cn('size-3.5', loading && 'animate-spin')} />
        </Button>
      </div>
    </div>
  )
}
