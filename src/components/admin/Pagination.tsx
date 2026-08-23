'use client'

import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'

import { cn } from '@/lib/cn'

export interface PaginationProps {
  page: number
  totalPages: number
  total: number
  pageSize: number
  className?: string
}

export function Pagination({ page, totalPages, total, pageSize, className }: PaginationProps) {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  if (totalPages <= 1) return null

  function hrefFor(target: number): string {
    const params = new URLSearchParams(searchParams.toString())
    if (target <= 1) params.delete('page')
    else params.set('page', String(target))
    const query = params.toString()
    return query ? `${pathname}?${query}` : pathname
  }

  const first = (page - 1) * pageSize + 1
  const last = Math.min(total, page * pageSize)

  return (
    <nav className={cn('flex flex-wrap items-center justify-between gap-3', className)} aria-label="Seitennavigation">
      <p className="text-[12.5px] text-fg-subtle">
        {first}–{last} von {total}
      </p>
      <div className="flex items-center gap-1.5">
        <PageLink href={hrefFor(page - 1)} disabled={page <= 1} label="Zurück" />
        <span className="px-2 text-[12.5px] tabular-nums text-fg-muted">
          Seite {page} / {totalPages}
        </span>
        <PageLink href={hrefFor(page + 1)} disabled={page >= totalPages} label="Weiter" />
      </div>
    </nav>
  )
}

function PageLink({ href, disabled, label }: { href: string; disabled: boolean; label: string }) {
  const classes =
    'inline-flex h-8 items-center rounded-control border border-line-strong px-3 text-[12.5px] font-medium transition-colors'

  if (disabled) {
    return <span className={cn(classes, 'cursor-not-allowed text-fg-subtle opacity-50')}>{label}</span>
  }
  return (
    <Link href={href} className={cn(classes, 'text-fg-muted hover:border-brand-accent/60 hover:text-fg')}>
      {label}
    </Link>
  )
}
