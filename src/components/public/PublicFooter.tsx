import Link from 'next/link'

export interface PublicFooterProps {
  brandName: string
  contact: {
    email: string
    website: string
    discord: string
    instagram: string
    twitch: string
  }
  note?: string
  footerNote?: string
}

const SOCIAL_LABELS: Record<string, string> = {
  website: 'swisshub.gg',
  discord: 'Discord',
  instagram: 'Instagram',
  twitch: 'Twitch',
}

export function PublicFooter({ brandName, contact, note, footerNote }: PublicFooterProps) {
  const links = (['website', 'discord', 'instagram', 'twitch'] as const)
    .map((key) => ({ key, url: contact[key] }))
    .filter((entry) => entry.url)

  return (
    <footer className="border-t border-line bg-surface/40">
      <div className="container-content py-12">
        <div className="flex flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
          <div className="max-w-sm">
            <p className="font-display text-[17px] font-semibold tracking-tight text-fg">{brandName}</p>
            {footerNote ? (
              <p className="mt-2 text-[13px] leading-relaxed text-fg-subtle">{footerNote}</p>
            ) : note ? (
              <p className="mt-2 text-[13px] leading-relaxed text-fg-subtle">{note}</p>
            ) : null}
            {contact.email ? (
              <a
                href={`mailto:${contact.email}`}
                className="mt-4 inline-block text-[13.5px] text-brand-accent transition-colors hover:text-fg"
              >
                {contact.email}
              </a>
            ) : null}
          </div>

          <div className="flex flex-col gap-6 sm:flex-row sm:gap-12">
            {links.length > 0 ? (
              <nav aria-label="SwissHub Kanäle">
                <p className="mb-2.5 text-[12px] font-semibold uppercase tracking-wide text-fg-subtle">Kanäle</p>
                <ul className="space-y-1.5">
                  {links.map((entry) => (
                    <li key={entry.key}>
                      <a
                        href={entry.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[13.5px] text-fg-muted transition-colors hover:text-fg"
                      >
                        {SOCIAL_LABELS[entry.key]}
                      </a>
                    </li>
                  ))}
                </ul>
              </nav>
            ) : null}

            <nav aria-label="Rechtliches">
              <p className="mb-2.5 text-[12px] font-semibold uppercase tracking-wide text-fg-subtle">Rechtliches</p>
              <ul className="space-y-1.5">
                <li>
                  <Link href="/impressum" className="text-[13.5px] text-fg-muted transition-colors hover:text-fg">
                    Impressum
                  </Link>
                </li>
                <li>
                  <Link href="/datenschutz" className="text-[13.5px] text-fg-muted transition-colors hover:text-fg">
                    Datenschutz
                  </Link>
                </li>
              </ul>
            </nav>
          </div>
        </div>

        <p className="mt-10 border-t border-line pt-6 text-[12.5px] text-fg-subtle">
          © {new Date().getFullYear()} {brandName}. Alle Rechte vorbehalten.
        </p>
      </div>
    </footer>
  )
}
