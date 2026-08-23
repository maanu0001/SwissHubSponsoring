import type { ReactNode } from 'react'

import { cn } from '@/lib/cn'
import type { Tone } from '@/lib/labels'

const TONES: Record<Tone, string> = {
  neutral: 'bg-surface-overlay text-fg-muted border-line-strong',
  info: 'bg-info/12 text-info border-info/30',
  success: 'bg-success/12 text-success border-success/30',
  warning: 'bg-warning/12 text-warning border-warning/30',
  danger: 'bg-danger/12 text-danger border-danger/30',
  brand: 'bg-brand-accent/12 text-brand-accent border-brand-accent/30',
}

export interface BadgeProps {
  tone?: Tone
  children: ReactNode
  className?: string
  dot?: boolean
}

export function Badge({ tone = 'neutral', children, className, dot }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-0.5 text-[12px] font-medium leading-5',
        TONES[tone],
        className,
      )}
    >
      {dot ? <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" /> : null}
      {children}
    </span>
  )
}
