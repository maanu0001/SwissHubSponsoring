import type { ReactNode } from 'react'

import { cn } from '@/lib/cn'

export interface EmptyStateProps {
  title: string
  description?: string
  action?: ReactNode
  icon?: ReactNode
  className?: string
  compact?: boolean
}

/** Consistent "nothing here yet" presentation used across every list view. */
export function EmptyState({ title, description, action, icon, className, compact }: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-card border border-dashed border-line-strong bg-surface/40 text-center',
        compact ? 'px-5 py-8' : 'px-6 py-14',
        className,
      )}
    >
      {icon ? (
        <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-surface-overlay text-fg-subtle">
          {icon}
        </div>
      ) : null}
      <p className="text-[15px] font-medium text-fg">{title}</p>
      {description ? <p className="mt-1.5 max-w-md text-[13px] leading-relaxed text-fg-subtle">{description}</p> : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  )
}
