'use client'

import { useRef, useState } from 'react'
import { useTranslations } from 'next-intl'
import { UploadCloud } from 'lucide-react'
import { ZoneContent, zoneAccent, zoneClassName, type ZoneLayout } from '@/components/ui/zone'

interface FileDropZoneProps {
  accept: string
  fileName?: string
  onFile: (file: File) => void
  formats?: string
  layout?: ZoneLayout
}

export function FileDropZone({
  accept,
  fileName,
  onFile,
  formats,
  layout,
}: FileDropZoneProps) {
  const t = useTranslations('Submission')
  const [isDrag, setIsDrag] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => inputRef.current?.click()}
      onKeyDown={(e) => e.key === 'Enter' && inputRef.current?.click()}
      onDragOver={(e) => { e.preventDefault(); setIsDrag(true) }}
      onDragLeave={() => setIsDrag(false)}
      onDrop={(e) => { e.preventDefault(); setIsDrag(false); const f = e.dataTransfer.files[0]; if (f) onFile(f) }}
      className={zoneClassName({ filled: !!fileName, highlighted: isDrag, layout })}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); e.target.value = '' }}
      />
      <ZoneContent
        icon={UploadCloud}
        prompt={t.rich('dropZone', { accent: zoneAccent })}
        badge={fileName}
        hint={fileName ? undefined : formats}
        layout={layout}
      />
    </div>
  )
}
