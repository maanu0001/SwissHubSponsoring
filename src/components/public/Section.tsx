import type { ReactNode } from 'react'

import { cn } from '@/lib/cn'
import { Reveal } from './Reveal'

export interface SectionShellProps {
  id?: string
  eyebrow?: string | null
  title?: string | null
  subtitle?: string | null
  children?: ReactNode
  className?: string
  /** Alternate surface so consecutive sections stay visually separated. */
  tone?: 'default' | 'raised'
  align?: 'left' | 'center'
  compact?: boolean
}

/** Consistent outer frame for every public section. */
export function SectionShell({
  id,
  eyebrow,
  title,
  subtitle,
  children,
  className,
  tone = 'default',
  align = 'left',
  compact,
}: SectionShellProps) {
  const hasHeading = Boolean(eyebrow || title || subtitle)

  return (
    <section
      id={id}
      className={cn(
        'scroll-mt-20 border-t border-line/70',
        tone === 'raised' ? 'bg-surface/40' : 'bg-transparent',
        compact ? 'py-12 sm:py-16' : 'py-16 sm:py-24',
        className,
      )}
    >
      <div className="container-content">
        {hasHeading ? (
          <Reveal className={cn('mb-9 sm:mb-12', align === 'center' && 'text-center')}>
            {eyebrow ? (
              <p className="mb-2.5 text-[12.5px] font-semibold uppercase tracking-[0.14em] text-brand-accent">
                {eyebrow}
              </p>
            ) : null}
            {title ? (
              <h2
                className={cn(
                  'font-display text-[26px] font-semibold leading-tight tracking-tight sm:text-[34px]',
                  align === 'center' && 'mx-auto max-w-3xl',
                )}
              >
                {title}
              </h2>
            ) : null}
            {subtitle ? (
              <p
                className={cn(
                  'mt-3 max-w-2xl text-[15px] leading-relaxed text-fg-muted sm:text-[16.5px]',
                  align === 'center' && 'mx-auto',
                )}
              >
                {subtitle}
              </p>
            ) : null}
          </Reveal>
        ) : null}
        {children}
      </div>
    </section>
  )
}
