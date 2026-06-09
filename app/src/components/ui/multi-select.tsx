"use client"

import * as React from "react"
import { ChevronDown } from "lucide-react"

import { cn } from "@/lib/utils"
import { controlFocus, controlHeight, controlPadding, controlRounded } from "@/components/ui/styles"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export interface MultiSelectOption {
  value: string
  label: string
}

interface MultiSelectProps {
  options: MultiSelectOption[]
  value: string[]
  onChange: (value: string[]) => void
  placeholder?: string
  className?: string
  align?: "start" | "center" | "end"
  size?: "sm" | "default"
  disabled?: boolean
}

export function MultiSelect({
  options,
  value,
  onChange,
  placeholder = "Select...",
  className,
  align = "start",
  size = "default",
  disabled = false,
}: MultiSelectProps) {
  const toggle = (optionValue: string) => {
    onChange(
      value.includes(optionValue)
        ? value.filter((v) => v !== optionValue)
        : [...value, optionValue]
    )
  }

  const selectedLabels = options
    .filter((o) => value.includes(o.value))
    .map((o) => o.label)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        data-placeholder={value.length === 0 ? true : undefined}
        data-size={size}
        disabled={disabled}
        className={cn(
          controlFocus,
          size === "sm" ? controlHeight.sm : controlHeight.md,
          size === "sm" ? controlPadding.sm : controlPadding.md,
          "flex w-fit items-center justify-between border border-border bg-transparent whitespace-nowrap select-none disabled:cursor-not-allowed disabled:opacity-50 data-placeholder:text-muted-foreground hover:cursor-pointer dark:bg-input/30 dark:hover:bg-input/50 [&_svg]:pointer-events-none [&_svg]:shrink-0",
          className
        )}
      >
        <span className="flex flex-1 items-center gap-1.5 overflow-hidden text-left">
          {value.length === 0 ? (
            <span className="text-muted-foreground">{placeholder}</span>
          ) : value.length <= 2 ? (
            selectedLabels.join(", ")
          ) : (
            `${value.length} selected`
          )}
        </span>
        <ChevronDown className="pointer-events-none text-muted-foreground" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align={align}>
        <div className="flex items-center gap-2 px-1 py-1">
          <button
            type="button"
            onClick={() => onChange([])}
            className={`inline-flex h-7 items-center ${controlRounded} border border-border bg-transparent px-2 text-xs text-text-muted transition-colors hover:border-text-muted hover:text-text-primary cursor-pointer`}
          >
            Select None
          </button>
          <button
            type="button"
            onClick={() => onChange(options.map((o) => o.value))}
            className={`inline-flex h-7 items-center ${controlRounded} border border-border bg-transparent px-2 text-xs text-text-muted transition-colors hover:border-text-muted hover:text-text-primary cursor-pointer`}
          >
            Select All
          </button>
        </div>
        <DropdownMenuSeparator />
        {options.map((option) => (
          <DropdownMenuCheckboxItem
            key={option.value}
            checked={value.includes(option.value)}
            onCheckedChange={() => toggle(option.value)}
          >
            {option.label}
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
