'use client'

import { useEffect, useState, type ReactNode } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { cn } from '@/lib/cn'
import { BrandMark } from '@/components/BrandMark'
import { NAV_ITEMS, isNavActive } from './nav-items'
import { UserMenu } from './UserMenu'

export interface AdminShellProps {
  user: { name: string; email: string }
  logoUrl: string | null
  brandName: string
  publicUrl: string
  children: ReactNode
}

export function AdminShell({ user, logoUrl, brandName, publicUrl, children }: AdminShellProps) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

  // Close the drawer whenever navigation happens.
  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  useEffect(() => {
    if (!mobileOpen) return
    const { overflow } = document.body.style
    document.body.style.overflow = 'hidden'
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') setMobileOpen(false)
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = overflow
      document.removeEventListener('keydown', onKey)
    }
  }, [mobileOpen])

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[260px_1fr]">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-dvh flex-col border-r border-line bg-surface lg:flex">
        <SidebarContent pathname={pathname} logoUrl={logoUrl} brandName={brandName} publicUrl={publicUrl} />
      </aside>

      {/* Mobile drawer */}
      {mobileOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Menü schliessen"
            className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-fade-in"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="relative z-10 flex h-full w-[85%] max-w-[300px] flex-col border-r border-line bg-surface animate-fade-in">
            <SidebarContent pathname={pathname} logoUrl={logoUrl} brandName={brandName} publicUrl={publicUrl} />
          </aside>
        </div>
      ) : null}

      <div className="flex min-w-0 flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-3 border-b border-line bg-canvas/85 px-4 backdrop-blur-md sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              aria-label="Navigation öffnen"
              aria-expanded={mobileOpen}
              className="-ml-1 rounded-control p-2 text-fg-muted transition-colors hover:bg-surface-raised hover:text-fg lg:hidden"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
              </svg>
            </button>
            <div className="lg:hidden">
              <BrandMark logoUrl={logoUrl} name={brandName} size="sm" />
            </div>
            <span className="hidden text-[13px] text-fg-subtle lg:block">Sponsoring-Plattform</span>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href={publicUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden items-center gap-1.5 rounded-control border border-line-strong px-3 py-1.5 text-[12.5px] text-fg-muted transition-colors hover:border-brand-accent/60 hover:text-fg sm:inline-flex"
            >
              Öffentliche Seite
              <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
                <path d="M7 4h9v9M16 4 5 15" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
            <UserMenu user={user} />
          </div>
        </header>

        <main id="main" className="min-w-0 flex-1 px-4 py-6 sm:px-6 sm:py-8">
          <div className="mx-auto w-full max-w-[1240px]">{children}</div>
        </main>
      </div>
    </div>
  )
}

function SidebarContent({
  pathname,
  logoUrl,
  brandName,
  publicUrl,
}: {
  pathname: string
  logoUrl: string | null
  brandName: string
  publicUrl: string
}) {
  return (
    <>
      <div className="flex h-14 shrink-0 items-center border-b border-line px-5">
        <Link href="/admin" className="flex min-w-0 items-center gap-2.5">
          <BrandMark logoUrl={logoUrl} name={brandName} size="sm" />
        </Link>
      </div>

      <nav aria-label="Hauptnavigation" className="min-h-0 flex-1 overflow-y-auto px-3 py-4">
        <ul className="space-y-0.5">
          {NAV_ITEMS.map((item) => {
            const active = isNavActive(item, pathname)
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'flex items-center gap-3 rounded-control px-3 py-2 text-[13.5px] font-medium transition-colors',
                    active
                      ? 'bg-brand/15 text-fg shadow-[inset_2px_0_0_rgb(var(--c-brand))]'
                      : 'text-fg-muted hover:bg-surface-raised hover:text-fg',
                  )}
                >
                  <span className={cn(active ? 'text-brand-accent' : 'text-fg-subtle')}>{item.icon}</span>
                  <span className="truncate">{item.label}</span>
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      <div className="shrink-0 border-t border-line px-3 py-3">
        <Link
          href={publicUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 rounded-control px-3 py-2 text-[13px] text-fg-subtle transition-colors hover:bg-surface-raised hover:text-fg"
        >
          <svg className="h-[18px] w-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
            <circle cx="12" cy="12" r="9" />
            <path d="M3 12h18M12 3c2.5 2.7 2.5 15.3 0 18M12 3c-2.5 2.7-2.5 15.3 0 18" />
          </svg>
          Öffentliche Sponsoring-Seite
        </Link>
      </div>
    </>
  )
}
