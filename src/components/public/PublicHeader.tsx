'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import type { Media } from '@prisma/client'

import { cn } from '@/lib/cn'
import { mediaUrl } from '@/lib/media'

export interface PublicHeaderProps {
  brandName: string
  logo: Media | null
  sections: { id: string; label: string }[]
  contactEmail: string
}

/** Sticky header with anchor navigation for the public main page. */
export function PublicHeader({ brandName, logo, sections, contactEmail }: PublicHeaderProps) {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  const url = mediaUrl(logo)

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 24)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header
      className={cn(
        'sticky top-0 z-40 transition-colors duration-300',
        scrolled ? 'border-b border-line bg-canvas/85 backdrop-blur-md' : 'border-b border-transparent',
      )}
    >
      <div className="container-content flex h-16 items-center justify-between gap-4">
        <Link href="/" className="flex min-w-0 items-center gap-2.5">
          {url ? (
            <img src={url} alt={brandName} className="h-8 w-auto max-w-[150px] object-contain" decoding="async" />
          ) : (
            <span className="font-display text-[18px] font-bold tracking-tight">{brandName}</span>
          )}
        </Link>

        <nav aria-label="Abschnitte" className="hidden items-center gap-1 lg:flex">
          {sections.map((section) => (
            <a
              key={section.id}
              href={`#${section.id}`}
              className="rounded-control px-3 py-1.5 text-[13px] text-fg-muted transition-colors hover:bg-surface-raised hover:text-fg"
            >
              {section.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {contactEmail ? (
            <a
              href={`mailto:${contactEmail}`}
              className="hidden h-9 items-center rounded-control bg-brand px-4 text-[13px] font-medium text-brand-fg transition-colors hover:bg-brand/85 sm:inline-flex"
            >
              Kontakt aufnehmen
            </a>
          ) : null}

          {sections.length > 0 ? (
            <button
              type="button"
              onClick={() => setOpen((value) => !value)}
              aria-expanded={open}
              aria-label="Abschnitte anzeigen"
              className="rounded-control p-2 text-fg-muted transition-colors hover:bg-surface-raised hover:text-fg lg:hidden"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                <path d={open ? 'M6 6l12 12M18 6 6 18' : 'M4 7h16M4 12h16M4 17h16'} strokeLinecap="round" />
              </svg>
            </button>
          ) : null}
        </div>
      </div>

      {open ? (
        <nav aria-label="Abschnitte" className="border-t border-line bg-canvas/95 backdrop-blur-md lg:hidden">
          <ul className="container-content grid gap-0.5 py-3">
            {sections.map((section) => (
              <li key={section.id}>
                <a
                  href={`#${section.id}`}
                  onClick={() => setOpen(false)}
                  className="block rounded-control px-3 py-2.5 text-[14px] text-fg-muted transition-colors hover:bg-surface-raised hover:text-fg"
                >
                  {section.label}
                </a>
              </li>
            ))}
            {contactEmail ? (
              <li className="mt-2">
                <a
                  href={`mailto:${contactEmail}`}
                  className="flex h-11 items-center justify-center rounded-control bg-brand text-[14px] font-medium text-brand-fg"
                >
                  Kontakt aufnehmen
                </a>
              </li>
            ) : null}
          </ul>
        </nav>
      ) : null}
    </header>
  )
}
