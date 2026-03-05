"use client"

import type { ReactNode } from "react"

import { Input } from "@/components/ui/Input"

interface DataTableToolbarProps {
  title?: string
  searchTerm?: string
  onSearchChange?: (value: string) => void
  searchPlaceholder?: string
  children?: ReactNode
}

export function DataTableToolbar({
  title,
  searchTerm,
  onSearchChange,
  searchPlaceholder = 'Search...',
  children,
}: DataTableToolbarProps) {
  return (
    <div className={title ? 'mb-4' : undefined}>
      {title && <h2 className="text-xl font-semibold text-white mb-3">{title}</h2>}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {onSearchChange ? (
          <Input
            placeholder={searchPlaceholder}
            value={searchTerm ?? ''}
            onChange={(e) => onSearchChange(e.target.value)}
            className="max-w-xs bg-gray-700 border-gray-600"
          />
        ) : (
          <div />
        )}
        <div className="flex items-center gap-2">
          {children}
        </div>
      </div>
    </div>
  );
}
