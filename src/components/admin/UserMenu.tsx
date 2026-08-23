'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'

import { logoutAction } from '@/server/actions/auth'

export function UserMenu({ user }: { user: { name: string; email: string } }) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function onPointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false)
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const initials = user.name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('') || 'SH'

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex items-center gap-2 rounded-control py-1 pl-1 pr-2 transition-colors hover:bg-surface-raised"
      >
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand text-[11px] font-semibold text-brand-fg">
          {initials}
        </span>
        <span className="hidden max-w-[140px] truncate text-[13px] text-fg-muted sm:block">{user.name}</span>
        <svg className="h-3.5 w-3.5 text-fg-subtle" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
          <path d="m6 8 4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open ? (
        <div
          role="menu"
          className="absolute right-0 top-[calc(100%+6px)] z-50 w-60 overflow-hidden rounded-card border border-line bg-surface-raised shadow-lift animate-scale-in"
        >
          <div className="border-b border-line px-4 py-3">
            <p className="truncate text-[13.5px] font-medium text-fg">{user.name}</p>
            <p className="truncate text-[12.5px] text-fg-subtle">{user.email}</p>
          </div>
          <div className="p-1.5">
            <Link
              href="/admin/settings/account"
              role="menuitem"
              className="block rounded-control px-3 py-2 text-[13px] text-fg-muted transition-colors hover:bg-surface-overlay hover:text-fg"
            >
              Konto & Passwort
            </Link>
            <Link
              href="/admin/settings/activity"
              role="menuitem"
              className="block rounded-control px-3 py-2 text-[13px] text-fg-muted transition-colors hover:bg-surface-overlay hover:text-fg"
            >
              Aktivitätsprotokoll
            </Link>
            <form action={logoutAction}>
              <button
                type="submit"
                role="menuitem"
                className="block w-full rounded-control px-3 py-2 text-left text-[13px] text-danger transition-colors hover:bg-danger/10"
              >
                Abmelden
              </button>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  )
}
