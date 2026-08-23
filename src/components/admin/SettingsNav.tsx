'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { cn } from '@/lib/cn'

const ITEMS = [
  { href: '/admin/settings/branding', label: 'Branding', description: 'Logo, Favicon und Farben' },
  { href: '/admin/settings/seo', label: 'SEO & Kontakt', description: 'Meta-Angaben und Kanäle' },
  { href: '/admin/settings/legal', label: 'Rechtliches', description: 'Impressum und Datenschutz' },
  { href: '/admin/settings/account', label: 'Konto', description: 'Zugangsdaten und Passwort' },
  { href: '/admin/settings/activity', label: 'Aktivitätsprotokoll', description: 'Alle Änderungen im Adminbereich' },
]

export function SettingsNav() {
  const pathname = usePathname()

  return (
    <nav aria-label="Einstellungen" className="min-w-0 lg:sticky lg:top-20 lg:self-start">
      <ul className="flex gap-1 overflow-x-auto no-scrollbar lg:flex-col lg:gap-0.5 lg:overflow-visible">
        {ITEMS.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`)
          return (
            <li key={item.href} className="shrink-0 lg:shrink">
              <Link
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'block whitespace-nowrap rounded-control px-3 py-2 transition-colors lg:whitespace-normal',
                  active ? 'bg-brand/15 text-fg' : 'text-fg-muted hover:bg-surface-raised hover:text-fg',
                )}
              >
                <span className="block text-[13.5px] font-medium">{item.label}</span>
                <span className="hidden text-[12px] text-fg-subtle lg:block">{item.description}</span>
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
