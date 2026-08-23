import type { ReactNode } from 'react'
import Link from 'next/link'

import { cn } from '@/lib/cn'

export interface Breadcrumb {
  label: string
  href?: string
}

export interface PageHeaderProps {
  title: string
  description?: string
  actions?: ReactNode
  breadcrumbs?: Breadcrumb[]
  className?: string
  meta?: ReactNode
}

export function PageHeader({ title, description, actions, breadcrumbs, className, meta }: PageHeaderProps) {
  return (
    <header className={cn('mb-6', className)}>
      {breadcrumbs && breadcrumbs.length > 0 ? (
        <nav aria-label="Breadcrumb" className="mb-2">
          <ol className="flex flex-wrap items-center gap-1.5 text-[12.5px] text-fg-subtle">
            {breadcrumbs.map((crumb, index) => (
              <li key={`${crumb.label}-${index}`} className="flex items-center gap-1.5">
                {index > 0 ? <span aria-hidden="true">/</span> : null}
                {crumb.href ? (
                  <Link href={crumb.href} className="transition-colors hover:text-fg">
                    {crumb.label}
                  </Link>
                ) : (
                  <span className="text-fg-muted">{crumb.label}</span>
                )}
              </li>
            ))}
          </ol>
        </nav>
      ) : null}

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="font-display text-[22px] font-semibold tracking-tight text-fg sm:text-[26px]">{title}</h1>
          {description ? (
            <p className="mt-1.5 max-w-2xl text-[13.5px] leading-relaxed text-fg-muted">{description}</p>
          ) : null}
          {meta ? <div className="mt-3 flex flex-wrap items-center gap-2">{meta}</div> : null}
        </div>
        {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
      </div>
    </header>
  )
}
