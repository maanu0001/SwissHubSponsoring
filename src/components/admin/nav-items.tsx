import type { ReactNode } from 'react'

export interface NavItem {
  href: string
  label: string
  icon: ReactNode
  /** Marks the item active for any nested route below it. */
  matchPrefix?: boolean
}

function Icon({ children }: { children: ReactNode }) {
  return (
    <svg
      className="h-[18px] w-[18px] shrink-0"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  )
}

export const NAV_ITEMS: NavItem[] = [
  {
    href: '/admin',
    label: 'Dashboard',
    icon: (
      <Icon>
        <rect x="3" y="3" width="7.5" height="8" rx="1.5" />
        <rect x="13.5" y="3" width="7.5" height="5" rx="1.5" />
        <rect x="3" y="14" width="7.5" height="7" rx="1.5" />
        <rect x="13.5" y="11" width="7.5" height="10" rx="1.5" />
      </Icon>
    ),
  },
  {
    href: '/admin/sponsors',
    label: 'Sponsoren',
    matchPrefix: true,
    icon: (
      <Icon>
        <path d="M3 20V9l6-4 6 4v11" />
        <path d="M15 20V12h6v8" />
        <path d="M2 20h20" />
        <path d="M7 12h2M7 16h2" />
      </Icon>
    ),
  },
  {
    href: '/admin/sponsor-pages',
    label: 'Sponsorenseiten',
    matchPrefix: true,
    icon: (
      <Icon>
        <rect x="3" y="3" width="18" height="18" rx="2.5" />
        <path d="M3 8.5h18" />
        <path d="M7 12.5h7M7 16h4" />
      </Icon>
    ),
  },
  {
    href: '/admin/tournaments',
    label: 'Turniere',
    matchPrefix: true,
    icon: (
      <Icon>
        <path d="M7 4h10v4a5 5 0 0 1-10 0V4Z" />
        <path d="M7 6H4.5A1.5 1.5 0 0 0 3 7.5C3 9.5 4.5 11 7 11" />
        <path d="M17 6h2.5A1.5 1.5 0 0 1 21 7.5C21 9.5 19.5 11 17 11" />
        <path d="M12 13v4M9 21h6M10 17h4l1 4H9l1-4Z" />
      </Icon>
    ),
  },
  {
    href: '/admin/templates',
    label: 'Templates',
    matchPrefix: true,
    icon: (
      <Icon>
        <rect x="3" y="3" width="18" height="18" rx="2.5" />
        <path d="M3 9h18M9 21V9" />
      </Icon>
    ),
  },
  {
    href: '/admin/benefits',
    label: 'Leistungen',
    matchPrefix: true,
    icon: (
      <Icon>
        <path d="m4 12 2.5 2.5L11 9" />
        <path d="M14 10h7M14 15h7M4 18l2.5 2.5L11 15" />
        <path d="M14 5h7" />
      </Icon>
    ),
  },
  {
    href: '/admin/media',
    label: 'Medien',
    matchPrefix: true,
    icon: (
      <Icon>
        <rect x="3" y="4" width="18" height="16" rx="2.5" />
        <circle cx="8.5" cy="9.5" r="1.8" />
        <path d="m3.5 17 4.5-4.5 3.5 3.5L15 12l5.5 5.5" />
      </Icon>
    ),
  },
  {
    href: '/admin/content',
    label: 'Inhalte',
    matchPrefix: true,
    icon: (
      <Icon>
        <path d="M4 5h16M4 10h16M4 15h10M4 20h7" />
      </Icon>
    ),
  },
  {
    href: '/admin/partners',
    label: 'Partner / Referenzen',
    matchPrefix: true,
    icon: (
      <Icon>
        <path d="M8 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
        <path d="M16.5 11a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z" />
        <path d="M2.5 19a5.5 5.5 0 0 1 11 0" />
        <path d="M15 14.2a4.5 4.5 0 0 1 6.5 4.05" />
      </Icon>
    ),
  },
  {
    href: '/admin/settings',
    label: 'Einstellungen',
    matchPrefix: true,
    icon: (
      <Icon>
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z" />
      </Icon>
    ),
  },
]

export function isNavActive(item: NavItem, pathname: string): boolean {
  if (item.matchPrefix) return pathname === item.href || pathname.startsWith(`${item.href}/`)
  return pathname === item.href
}
