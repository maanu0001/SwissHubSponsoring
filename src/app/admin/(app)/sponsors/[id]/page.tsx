import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { Badge } from '@/components/ui/Badge'
import { ButtonLink } from '@/components/ui/Button'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { PageHeader } from '@/components/ui/PageHeader'
import { MediaThumb } from '@/components/admin/MediaThumb'
import { SponsorForm } from '@/components/admin/SponsorForm'
import { SponsorDangerZone } from '@/components/admin/SponsorDangerZone'
import { prisma } from '@/lib/db'
import { env } from '@/lib/env'
import { formatAmount, formatDate, formatDateTime } from '@/lib/format'
import { ACTIVITY_ACTION, PAGE_STATUS, PAGE_VISIBILITY, SPONSOR_STATUS, SUPPORT_TYPE } from '@/lib/labels'
import { requireUser } from '@/lib/session'

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const sponsor = await prisma.sponsor.findUnique({ where: { id }, select: { companyName: true } })
  return { title: sponsor?.companyName ?? 'Sponsor' }
}

export default async function SponsorDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireUser()
  const { id } = await params

  const sponsor = await prisma.sponsor.findUnique({
    where: { id },
    include: {
      logo: true,
      pages: {
        orderBy: { updatedAt: 'desc' },
        include: {
          tournament: { select: { title: true, game: true } },
          _count: { select: { benefits: true, sections: true } },
        },
      },
    },
  })

  if (!sponsor) notFound()

  const activities = await prisma.activityLog.findMany({
    where: {
      OR: [
        { entityType: 'Sponsor', entityId: id },
        { entityType: 'SponsorPage', entityId: { in: sponsor.pages.map((page) => page.id) } },
      ],
    },
    orderBy: { createdAt: 'desc' },
    take: 12,
    include: { user: { select: { name: true } } },
  })

  const status = SPONSOR_STATUS[sponsor.status]

  return (
    <>
      <PageHeader
        title={sponsor.companyName}
        breadcrumbs={[{ label: 'Sponsoren', href: '/admin/sponsors' }, { label: sponsor.companyName }]}
        description={sponsor.industry ?? undefined}
        meta={
          <>
            <Badge tone={status.tone} dot>
              {status.label}
            </Badge>
            {sponsor.lastContactDate ? (
              <span className="text-[12.5px] text-fg-subtle">
                Letzter Kontakt: {formatDate(sponsor.lastContactDate)}
              </span>
            ) : null}
            <span className="text-[12.5px] text-fg-subtle">Erstellt: {formatDate(sponsor.createdAt)}</span>
          </>
        }
        actions={<ButtonLink href={`/admin/sponsors/${sponsor.id}/create-page`}>Neue Sponsorenseite</ButtonLink>}
      />

      <div className="grid gap-5 lg:grid-cols-[1.5fr_1fr] [&>*]:min-w-0">
        <div className="space-y-5">
          <Card>
            <CardHeader title="Stammdaten" description="Alle Angaben zum Unternehmen und zum Ansprechpartner." />
            <CardBody>
              <SponsorForm sponsor={sponsor} logo={sponsor.logo} />
            </CardBody>
          </Card>

          <Card>
            <CardHeader
              title="Sponsorenseiten"
              description="Individuelle Pitches für dieses Unternehmen."
              actions={
                <ButtonLink href={`/admin/sponsors/${sponsor.id}/create-page`} variant="secondary" size="sm">
                  Seite erstellen
                </ButtonLink>
              }
            />
            <CardBody className="p-0">
              {sponsor.pages.length === 0 ? (
                <div className="p-5">
                  <EmptyState
                    compact
                    title="Noch keine Sponsorenseite"
                    description="Erstellen Sie eine individuelle Seite, die Sie diesem Unternehmen per E-Mail senden können."
                    action={
                      <ButtonLink href={`/admin/sponsors/${sponsor.id}/create-page`} size="sm">
                        Sponsorenseite erstellen
                      </ButtonLink>
                    }
                  />
                </div>
              ) : (
                <ul className="divide-y divide-line">
                  {sponsor.pages.map((page) => (
                    <li key={page.id}>
                      <Link
                        href={`/admin/sponsor-pages/${page.id}`}
                        className="block px-5 py-3.5 transition-colors hover:bg-surface-raised"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate text-[13.5px] font-medium text-fg">{page.title}</p>
                            <p className="mt-0.5 truncate text-[12px] text-fg-subtle">
                              {env.appUrl}/partner/{page.slug}
                            </p>
                          </div>
                          <div className="flex shrink-0 flex-wrap items-center gap-1.5">
                            <Badge tone={PAGE_STATUS[page.status].tone}>{PAGE_STATUS[page.status].label}</Badge>
                            {page.visibility === 'PASSWORD_PROTECTED' ? (
                              <Badge tone={PAGE_VISIBILITY.PASSWORD_PROTECTED.tone}>Passwortgeschützt</Badge>
                            ) : null}
                          </div>
                        </div>
                        <p className="mt-2 text-[12px] text-fg-subtle">
                          {page.tournament ? `${page.tournament.title} · ` : ''}
                          {SUPPORT_TYPE[page.requestedSupportType].label}
                          {page.requestedAmount
                            ? ` · ${formatAmount(page.requestedAmount, page.currency)}`
                            : ''}
                          {` · ${page._count.benefits} Leistungen · ${page._count.sections} Sektionen`}
                          {page.viewCount > 0 ? ` · ${page.viewCount} Aufrufe` : ''}
                        </p>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </CardBody>
          </Card>

          <SponsorDangerZone
            sponsorId={sponsor.id}
            companyName={sponsor.companyName}
            archived={sponsor.status === 'ARCHIVED'}
            pageCount={sponsor.pages.length}
          />
        </div>

        <div className="space-y-5">
          <Card>
            <CardHeader title="Übersicht" />
            <CardBody className="space-y-4">
              <div className="flex items-center gap-3">
                <MediaThumb media={sponsor.logo} className="h-14 w-14 shrink-0" fallback="Kein Logo" />
                <div className="min-w-0">
                  <p className="truncate text-[14px] font-medium text-fg">{sponsor.companyName}</p>
                  {sponsor.website ? (
                    <a
                      href={sponsor.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="truncate text-[12.5px] text-brand-accent hover:underline"
                    >
                      {sponsor.website.replace(/^https?:\/\//, '')}
                    </a>
                  ) : (
                    <p className="text-[12.5px] text-fg-subtle">Keine Website hinterlegt</p>
                  )}
                </div>
              </div>

              <dl className="space-y-2.5 border-t border-line pt-4 text-[13px]">
                <DetailRow label="Ansprechpartner" value={sponsor.contactName} />
                <DetailRow
                  label="E-Mail"
                  value={sponsor.contactEmail}
                  href={sponsor.contactEmail ? `mailto:${sponsor.contactEmail}` : undefined}
                />
                <DetailRow
                  label="Telefon"
                  value={sponsor.contactPhone}
                  href={sponsor.contactPhone ? `tel:${sponsor.contactPhone.replace(/\s/g, '')}` : undefined}
                />
                <DetailRow label="Branche" value={sponsor.industry} />
                <DetailRow label="Interner Slug" value={sponsor.slug} />
                <DetailRow label="Zuletzt bearbeitet" value={formatDateTime(sponsor.updatedAt)} />
              </dl>
            </CardBody>
          </Card>

          {sponsor.internalNotes ? (
            <Card>
              <CardHeader title="Interne Notizen" description="Nur im Adminbereich sichtbar." />
              <CardBody>
                <p className="whitespace-pre-wrap text-[13px] leading-relaxed text-fg-muted">
                  {sponsor.internalNotes}
                </p>
              </CardBody>
            </Card>
          ) : null}

          {activities.length > 0 ? (
            <Card>
              <CardHeader title="Verlauf" description="Änderungen an diesem Sponsor und seinen Seiten." />
              <CardBody className="p-0">
                <ul className="divide-y divide-line">
                  {activities.map((entry) => (
                    <li key={entry.id} className="px-5 py-2.5">
                      <p className="text-[13px] leading-snug text-fg-muted">{entry.summary}</p>
                      <p className="mt-0.5 text-[11.5px] text-fg-subtle">
                        {ACTIVITY_ACTION[entry.action].label} · {formatDateTime(entry.createdAt)}
                        {entry.user ? ` · ${entry.user.name}` : ''}
                      </p>
                    </li>
                  ))}
                </ul>
              </CardBody>
            </Card>
          ) : null}

          <div className="grid gap-3">
            <ButtonLink href="/admin/tournaments" variant="secondary" size="sm">
              Turnierverwaltung öffnen
            </ButtonLink>
          </div>
        </div>
      </div>
    </>
  )
}

function DetailRow({ label, value, href }: { label: string; value?: string | null; href?: string }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <dt className="shrink-0 text-fg-subtle">{label}</dt>
      <dd className="min-w-0 text-right">
        {value ? (
          href ? (
            <a href={href} className="break-words text-brand-accent hover:underline">
              {value}
            </a>
          ) : (
            <span className="break-words text-fg-muted">{value}</span>
          )
        ) : (
          <span className="text-fg-subtle">—</span>
        )}
      </dd>
    </div>
  )
}
