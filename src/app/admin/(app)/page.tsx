import type { Metadata } from 'next'
import Link from 'next/link'

import { PageHeader } from '@/components/ui/PageHeader'
import { StatCard } from '@/components/ui/StatCard'
import { Badge } from '@/components/ui/Badge'
import { ButtonLink } from '@/components/ui/Button'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { prisma } from '@/lib/db'
import { formatDate, formatRelative } from '@/lib/format'
import { ACTIVITY_ACTION, PAGE_STATUS, SPONSOR_STATUS } from '@/lib/labels'
import { recentActivity } from '@/lib/activity'
import { requireUser } from '@/lib/session'
import { MediaThumb } from '@/components/admin/MediaThumb'

export const metadata: Metadata = { title: 'Dashboard' }
export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const user = await requireUser('/admin')

  const [
    sponsorCounts,
    totalSponsors,
    publishedPages,
    draftPages,
    plannedTournaments,
    pastTournaments,
    recentSponsors,
    activities,
    topPages,
  ] = await Promise.all([
    prisma.sponsor.groupBy({ by: ['status'], _count: { _all: true } }),
    prisma.sponsor.count({ where: { status: { not: 'ARCHIVED' } } }),
    prisma.sponsorPage.count({ where: { status: 'PUBLISHED' } }),
    prisma.sponsorPage.count({ where: { status: 'DRAFT' } }),
    prisma.tournament.count({ where: { status: { in: ['PLANNED', 'OPEN', 'RUNNING'] } } }),
    prisma.tournament.count({ where: { status: 'COMPLETED' } }),
    prisma.sponsor.findMany({
      where: { status: { not: 'ARCHIVED' } },
      orderBy: { updatedAt: 'desc' },
      take: 6,
      include: {
        logo: true,
        pages: { select: { id: true, slug: true, status: true }, orderBy: { updatedAt: 'desc' }, take: 1 },
      },
    }),
    recentActivity(10),
    prisma.sponsorPage.findMany({
      where: { status: 'PUBLISHED', viewCount: { gt: 0 } },
      orderBy: { viewCount: 'desc' },
      take: 5,
      include: { sponsor: { select: { companyName: true } } },
    }),
  ])

  const byStatus = new Map(sponsorCounts.map((row) => [row.status, row._count._all]))
  const count = (status: keyof typeof SPONSOR_STATUS) => byStatus.get(status) ?? 0

  const openRequests = count('NOT_CONTACTED') + count('CONTACTED')

  return (
    <>
      <PageHeader
        title={`Willkommen zurück, ${user.name.split(' ')[0] ?? user.name}`}
        description="Überblick über Sponsoren, Sponsorenseiten und Turniere."
        actions={
          <>
            <ButtonLink href="/admin/sponsors/new" variant="primary">
              Neuen Sponsor erstellen
            </ButtonLink>
          </>
        }
      />

      <section aria-label="Kennzahlen" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Sponsoren" value={totalSponsors} hint="Ohne archivierte Einträge" href="/admin/sponsors" />
        <StatCard
          label="Offene Anfragen"
          value={openRequests}
          hint="Noch nicht kontaktiert oder kontaktiert"
          href="/admin/sponsors?status=CONTACTED"
          tone="warning"
        />
        <StatCard
          label="In Gesprächen"
          value={count('IN_TALKS')}
          hint="Aktive Verhandlungen"
          href="/admin/sponsors?status=IN_TALKS"
          tone="brand"
        />
        <StatCard
          label="Zugesagt"
          value={count('CONFIRMED')}
          hint="Bestätigte Partnerschaften"
          href="/admin/sponsors?status=CONFIRMED"
          tone="success"
        />
        <StatCard
          label="Abgesagt"
          value={count('DECLINED')}
          hint="Kein Interesse oder abgelehnt"
          href="/admin/sponsors?status=DECLINED"
        />
        <StatCard
          label="Veröffentlichte Seiten"
          value={publishedPages}
          hint={`${draftPages} Entwurf${draftPages === 1 ? '' : 'e'} in Arbeit`}
          href="/admin/sponsor-pages?status=PUBLISHED"
          tone="success"
        />
        <StatCard
          label="Geplante Turniere"
          value={plannedTournaments}
          hint="Geplant, offen oder laufend"
          href="/admin/tournaments"
        />
        <StatCard
          label="Vergangene Turniere"
          value={pastTournaments}
          hint="Abgeschlossen"
          href="/admin/tournaments?status=COMPLETED"
        />
      </section>

      <div className="mt-6 grid gap-5 lg:grid-cols-[1.35fr_1fr] [&>*]:min-w-0">
        <Card>
          <CardHeader
            title="Zuletzt bearbeitete Sponsoren"
            description="Die sechs zuletzt aktualisierten Einträge."
            actions={
              <Link href="/admin/sponsors" className="text-[13px] text-brand-accent transition-colors hover:text-fg">
                Alle ansehen
              </Link>
            }
          />
          <CardBody className="p-0">
            {recentSponsors.length === 0 ? (
              <div className="p-5">
                <EmptyState
                  compact
                  title="Noch keine Sponsoren erfasst"
                  description="Legen Sie den ersten Sponsor an, um eine individuelle Sponsorenseite zu erstellen."
                  action={
                    <ButtonLink href="/admin/sponsors/new" size="sm">
                      Sponsor erstellen
                    </ButtonLink>
                  }
                />
              </div>
            ) : (
              <ul className="divide-y divide-line">
                {recentSponsors.map((sponsor) => {
                  const page = sponsor.pages[0]
                  return (
                    <li key={sponsor.id}>
                      <Link
                        href={`/admin/sponsors/${sponsor.id}`}
                        className="flex items-center gap-3.5 px-5 py-3 transition-colors hover:bg-surface-raised"
                      >
                        <MediaThumb media={sponsor.logo} className="h-9 w-9 shrink-0" fallback="—" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[13.5px] font-medium text-fg">{sponsor.companyName}</p>
                          <p className="truncate text-[12px] text-fg-subtle">
                            {sponsor.industry || 'Keine Branche'} · {formatRelative(sponsor.updatedAt)}
                          </p>
                        </div>
                        {/* No `shrink-0`: the badges must be able to wrap on narrow screens. */}
                        <div className="flex flex-wrap items-center justify-end gap-1.5">
                          {page ? (
                            <Badge tone={PAGE_STATUS[page.status].tone}>{PAGE_STATUS[page.status].label}</Badge>
                          ) : null}
                          <Badge tone={SPONSOR_STATUS[sponsor.status].tone} dot>
                            {SPONSOR_STATUS[sponsor.status].label}
                          </Badge>
                        </div>
                      </Link>
                    </li>
                  )
                })}
              </ul>
            )}
          </CardBody>
        </Card>

        <div className="space-y-5">
          <Card>
            <CardHeader title="Letzte Aktivitäten" description="Änderungen im Adminbereich." />
            <CardBody className="p-0">
              {activities.length === 0 ? (
                <p className="px-5 py-6 text-[13px] text-fg-subtle">Noch keine Aktivitäten erfasst.</p>
              ) : (
                <ul className="divide-y divide-line">
                  {activities.map((entry) => (
                    <li key={entry.id} className="flex items-start gap-3 px-5 py-2.5">
                      <span
                        className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-accent"
                        aria-hidden="true"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-[13px] leading-snug text-fg-muted">{entry.summary}</p>
                        <p className="mt-0.5 text-[11.5px] text-fg-subtle">
                          {ACTIVITY_ACTION[entry.action].label} · {formatRelative(entry.createdAt)}
                          {entry.user ? ` · ${entry.user.name}` : ''}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardBody>
          </Card>

          {topPages.length > 0 ? (
            <Card>
              <CardHeader title="Meistaufgerufene Sponsorenseiten" description="Datenschutzfreundliche Aufrufzählung." />
              <CardBody className="p-0">
                <ul className="divide-y divide-line">
                  {topPages.map((page) => (
                    <li key={page.id}>
                      <Link
                        href={`/admin/sponsor-pages/${page.id}`}
                        className="flex items-center justify-between gap-3 px-5 py-2.5 transition-colors hover:bg-surface-raised"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-[13px] text-fg">{page.sponsor.companyName}</p>
                          <p className="truncate text-[11.5px] text-fg-subtle">
                            /partner/{page.slug} · zuletzt {formatDate(page.lastViewedAt)}
                          </p>
                        </div>
                        <span className="shrink-0 font-display text-[15px] font-semibold tabular-nums text-fg">
                          {page.viewCount}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </CardBody>
            </Card>
          ) : null}
        </div>
      </div>

      <Card className="mt-5">
        <CardHeader
          title="Schnellzugriff"
          description="Die häufigsten Aufgaben – in wenigen Klicks zur fertigen Sponsorenseite."
        />
        <CardBody>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <QuickAction
              href="/admin/sponsors/new"
              title="Sponsor & Seite erstellen"
              description="Assistent mit Turnier, Unterstützung, Leistungen und Template."
            />
            <QuickAction
              href="/admin/tournaments/new"
              title="Turnier anlegen"
              description="Neues Turnier mit Format, Terminen und Streamlinks."
            />
            <QuickAction
              href="/admin/benefits"
              title="Leistungen verwalten"
              description="Leistungskatalog erweitern und anpassen."
            />
            <QuickAction
              href="/admin/content"
              title="Öffentliche Seite bearbeiten"
              description="Inhalte, Kennzahlen und Reihenfolge der Hauptseite."
            />
          </div>
        </CardBody>
      </Card>
    </>
  )
}

function QuickAction({ href, title, description }: { href: string; title: string; description: string }) {
  return (
    <Link
      href={href}
      className="group rounded-control border border-line bg-surface-raised px-4 py-3.5 transition-colors hover:border-brand-accent/60 hover:bg-surface-overlay"
    >
      <p className="text-[13.5px] font-medium text-fg">{title}</p>
      <p className="mt-1 text-[12.5px] leading-relaxed text-fg-subtle">{description}</p>
      <span className="mt-2 inline-flex items-center gap-1 text-[12.5px] text-brand-accent opacity-0 transition-opacity group-hover:opacity-100">
        Öffnen
        <svg className="h-3 w-3" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path d="m8 5 5 5-5 5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
    </Link>
  )
}
