export const controlFocus =
  "rounded-sm outline-none transition-shadow " +
  "focus-visible:border-accent-green focus-visible:ring-3 focus-visible:ring-ring/50 " +
  "aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 " +
  "dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40"

export const controlHeight = {
  sm: "h-7",
  md: "h-9",
  lg: "h-10",
} as const

export const controlSize = {
  sm: "h-7 w-7",
  md: "h-9 w-9",
  lg: "h-10 w-10",
} as const

export const controlPadding = {
  sm: "gap-1 px-2 text-xs [&_svg:not([class*='size-'])]:size-3.5",
  md: "gap-1.5 py-2 pr-2 pl-2.5 text-sm [&_svg:not([class*='size-'])]:size-4",
} as const

export const controlBase = `${controlHeight.md} ${controlFocus}`
