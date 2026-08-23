import Link from 'next/link'
import type { ReactNode } from 'react'

export interface ErrorShellProps {
  code: string
  title: string
  description: string
  children?: ReactNode
  primaryHref?: string
  primaryLabel?: string
}

/** Shared layout for 404 / 403 / 500 and the sponsor page access screens. */
export function ErrorShell({
  code,
  title,
  description,
  children,
  primaryHref = '/',
  primaryLabel = 'Zur Startseite',
}: ErrorShellProps) {
  return (
    <main id="main" className="relative flex min-h-dvh items-center justify-center overflow-hidden px-5 py-16">
      <div className="brand-glow pointer-events-none absolute inset-0 -z-10" aria-hidden="true" />
      <div className="grid-texture pointer-events-none absolute inset-0 -z-10 opacity-40" aria-hidden="true" />

      <div className="w-full max-w-lg text-center">
        <p className="font-display text-[64px] font-semibold leading-none tracking-tight text-brand-accent/90 sm:text-[80px]">
          {code}
        </p>
        <h1 className="mt-4 font-display text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h1>
        <p className="mx-auto mt-3 max-w-md text-[14.5px] leading-relaxed text-fg-muted">{description}</p>

        {children ? <div className="mt-8">{children}</div> : null}

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            href={primaryHref}
            className="inline-flex h-11 items-center rounded-control bg-brand px-5 text-sm font-medium text-brand-fg transition-colors hover:bg-brand/85"
          >
            {primaryLabel}
          </Link>
        </div>
      </div>
    </main>
  )
}
