'use client'

import { useState, type ReactNode } from 'react'
import { useTranslations } from 'next-intl'
import { Textarea } from '@/components/ui/textarea'
import type { FileTextResult } from '@/lib/utils/file-parser'
import { FileDropZone } from './file-drop-zone'

interface FileTextInputProps {
  accept: string
  formats: string
  placeholder: string
  value: string
  onChange: (value: string) => void
  readFile: (file: File) => Promise<FileTextResult>
  maxFileSize?: number
  onError: (message: string) => void
  children?: ReactNode
}

export function FileTextInput({
  accept,
  formats,
  placeholder,
  value,
  onChange,
  readFile,
  maxFileSize,
  onError,
  children,
}: FileTextInputProps) {
  const t = useTranslations('Submission')
  const tCommon = useTranslations('Common')
  const [loaded, setLoaded] = useState<{ name: string; text: string } | null>(null)

  const handleFile = async (file: File) => {
    onError('')
    if (maxFileSize && file.size > maxFileSize) {
      onError(t('fileTooLarge', { maxKb: maxFileSize / 1024 }))
      return
    }
    const result = await readFile(file)
    if (typeof result !== 'string') {
      onError(t(`fileErrors.${result.error}`))
      return
    }
    setLoaded({ name: file.name, text: result })
    onChange(result)
  }

  return (
    <div className="flex items-stretch gap-0 min-h-40 max-sm:flex-col">
      <div className="flex min-w-0 flex-1 flex-col gap-3">
        <FileDropZone
          accept={accept}
          fileName={loaded?.text === value ? loaded.name : undefined}
          onFile={handleFile}
          formats={formats}
          layout={children ? 'row' : 'compact'}
        />
        {children}
      </div>

      <div className="flex-shrink-0 w-8 flex items-center justify-center text-[11px] text-text-muted max-sm:w-full max-sm:py-1.5 max-sm:justify-center">
        {tCommon('or')}
      </div>

      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="flex-1 font-mono max-sm:min-h-24"
      />
    </div>
  )
}
