import type { ReactNode } from 'react'

import { cn } from '@/lib/cn'

export type AlertTone = 'info' | 'success' | 'warning' | 'danger'

const TONES: Record<AlertTone, string> = {
  info: 'border-info/35 bg-info/10 text-info',
  success: 'border-success/35 bg-success/10 text-success',
  warning: 'border-warning/35 bg-warning/10 text-warning',
  danger: 'border-danger/35 bg-danger/10 text-danger',
}

const ICONS: Record<AlertTone, ReactNode> = {
  info: <path d="M12 8h.01M11 12h1v4h1" strokeLinecap="round" strokeLinejoin="round" />,
  success: <path d="m8 12.5 2.5 2.5L16 9.5" strokeLinecap="round" strokeLinejoin="round" />,
  warning: <path d="M12 8v5m0 3h.01" strokeLinecap="round" strokeLinejoin="round" />,
  danger: <path d="M12 8v5m0 3h.01" strokeLinecap="round" strokeLinejoin="round" />,
}

export function Alert({
  tone = 'info',
  title,
  children,
  className,
}: {
  tone?: AlertTone
  title?: string
  children?: ReactNode
  className?: string
}) {
  return (
    <div
      role={tone === 'danger' ? 'alert' : 'status'}
      className={cn('flex gap-3 rounded-control border px-4 py-3 text-[13px] leading-relaxed', TONES[tone], className)}
    >
      <svg className="mt-0.5 h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
        <circle cx="12" cy="12" r="9" />
        {ICONS[tone]}
      </svg>
      <div className="min-w-0">
        {title ? <p className="font-medium">{title}</p> : null}
        {children ? <div className={cn(title && 'mt-0.5', 'text-current/85')}>{children}</div> : null}
      </div>
    </div>
  )
}
