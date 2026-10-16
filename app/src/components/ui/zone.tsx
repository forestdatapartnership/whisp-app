import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { controlRounded } from '@/components/ui/styles'

export type ZoneLayout = 'default' | 'compact' | 'row'

const LAYOUT: Record<ZoneLayout, string> = {
  default: 'p-8 h-40',
  compact: 'flex-1 p-5',
  // Two stacked row zones and their gap take the height of one compact zone, so tabs line up.
  row: 'flex-1 min-h-16 flex-row gap-3 px-4 py-1',
}

interface ZoneStyle {
  filled: boolean
  highlighted?: boolean
  layout?: ZoneLayout
}

export function zoneClassName({ filled, highlighted = false, layout = 'default' }: ZoneStyle) {
  return cn(
    `border-[1.5px] border-dashed ${controlRounded} flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors`,
    LAYOUT[layout],
    filled
      ? 'border-accent-green-dim bg-accent-green/[0.06]'
      : highlighted
        ? 'border-accent-green bg-accent-green/[0.04]'
        : 'border-border bg-surface hover:border-accent-green hover:bg-accent-green/[0.04]'
  )
}

export const zoneAccent = (chunks: ReactNode) => <span className="text-accent-green">{chunks}</span>

interface ZoneContentProps {
  icon: LucideIcon
  prompt: ReactNode
  badge?: string
  hint?: string
  layout?: ZoneLayout
}

export function ZoneContent({ icon: Icon, prompt, badge, hint, layout = 'default' }: ZoneContentProps) {
  const row = layout === 'row'
  return (
    <>
      <div className={cn(
        `size-10 ${controlRounded} flex items-center justify-center`,
        row ? 'shrink-0' : 'mb-1',
        badge ? 'bg-accent-green/20 text-accent-green' : 'bg-surface-raised text-text-muted'
      )}>
        <Icon className="size-5" />
      </div>
      <div className={row ? 'flex min-w-0 flex-col gap-0.5 text-left leading-tight' : 'contents'}>
        {badge ? (
          <span
            title={badge}
            className={cn(
              'max-w-full truncate text-[12px] font-medium text-accent-green bg-accent-green/10 px-2.5 py-0.5 rounded-full',
              row && 'self-start'
            )}
          >
            {badge}
          </span>
        ) : (
          <span className={cn('font-medium text-text-primary', !row && 'text-center', layout === 'default' ? 'text-[14px]' : 'text-[13px]')}>
            {prompt}
          </span>
        )}
        {hint && <span className={cn('text-[12px] text-text-muted', !row && 'text-center')}>{hint}</span>}
      </div>
    </>
  )
}
