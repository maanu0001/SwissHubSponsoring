import type { ReactNode } from 'react'
import Link from 'next/link'

import { cn } from '@/lib/cn'

export interface StatCardProps {
  label: string
  value: ReactNode
  hint?: string
  icon?: ReactNode
  href?: string
  tone?: 'default' | 'brand' | 'success' | 'warning'
  className?: string
}

const TONES = {
  default: 'text-fg',
  brand: 'text-brand-accent',
  success: 'text-success',
  warning: 'text-warning',
}

/** KPI tile used on the admin dashboard. */
export function StatCard({ label, value, hint, icon, href, tone = 'default', className }: StatCardProps) {
  const content = (
    <>
      <div className="flex items-start justify-between gap-3">
        <p className="text-[12.5px] font-medium uppercase tracking-wide text-fg-subtle">{label}</p>
        {icon ? <span className="text-fg-subtle">{icon}</span> : null}
      </div>
      <p className={cn('mt-3 font-display text-3xl font-semibold tabular-nums tracking-tight', TONES[tone])}>{value}</p>
      {hint ? <p className="mt-1.5 text-[12.5px] leading-relaxed text-fg-subtle">{hint}</p> : null}
    </>
  )

  const classes = cn(
    'block rounded-card border border-line bg-surface px-5 py-4 transition-colors',
    href && 'hover:border-line-strong hover:bg-surface-raised',
    className,
  )

  return href ? (
    <Link href={href} className={classes}>
      {content}
    </Link>
  ) : (
    <div className={classes}>{content}</div>
  )
}
