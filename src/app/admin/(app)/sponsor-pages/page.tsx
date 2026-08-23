import type { Metadata } from 'next'
import Link from 'next/link'
import type { PageStatus, Prisma } from '@prisma/client'

import { Badge } from '@/components/ui/Badge'
import { ButtonLink } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { PageHeader } from '@/components/ui/PageHeader'
import { Pagination } from '@/components/admin/Pagination'
import { SponsorPageFilters } from '@/components/admin/SponsorPageFilters'
import { prisma } from '@/lib/db'
import { env } from '@/lib/env'
import { formatAmount, formatDate } from '@/lib/format'
import { PAGE_STATUS, PAGE_STATUS_ORDER, PAGE_VISIBILITY, SUPPORT_TYPE } from '@/lib/labels'
import { requireUser } from '@/lib/session'

export const metadata: Metadata = { title: 'Sponsorenseiten' }
export const dynamic = 'force-dynamic'

const PAGE_SIZE = 25

export default async function SponsorPagesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; tournament?: string; sort?: string; page?: string }>
}) {
  await requireUser()
  const params = await searchParams

  const query = params.q?.trim() ?? ''
  const status = PAGE_STATUS_ORDER.includes(params.status as PageStatus)
    ? (params.status as PageStatus)
    : undefined
  const tournamentId = params.tournament?.trim() || undefined
  const sort = params.sort === 'views' ? 'views' : params.sort === 'title' ? 'title' : 'updated'
  const page = Math.max(1, Number.parseInt(params.page ?? '1', 10) || 1)

  const where: Prisma.SponsorPageWhereInput = {
    ...(status ? { status } : {}),
    ...(tournamentId ? { tournamentId } : {}),
    ...(query
      ? {
          OR: [
            { title: { contains: query, mode: 'insensitive' } },
            { slug: { contains: query, mode: 'insensitive' } },
            { sponsor: { companyName: { contains: query, mode: 'insensitive' } } },
          ],
        }
      : {}),
  }

  const orderBy: Prisma.SponsorPageOrderByWithRelationInput[] =
    sort === 'views' ? [{ viewCount: 'desc' }] : sort === 'title' ? [{ title: 'asc' }] : [{ updatedAt: 'desc' }]

  const [pages, total, tournaments] = await Promise.all([
    prisma.sponsorPage.findMany({
      where,
      orderBy,
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: {
        sponsor: { select: { id: true, companyName: true } },
        tournament: { select: { title: true } },
        _count: { select: { benefits: true, sections: true } },
      },
    }),
    prisma.sponsorPage.count({ where }),
    prisma.tournament.findMany({ orderBy: { title: 'asc' }, select: { id: true, title: true } }),
  ])

  const hasFilters = Boolean(query || status || tournamentId)
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  return (
    <>
      <PageHeader
        title="Sponsorenseiten"
        description="Alle individuellen Sponsoring-Seiten – Entwürfe, veröffentlichte und archivierte."
        actions={<ButtonLink href="/admin/sponsors/new">Neuen Sponsor erstellen</ButtonLink>}
        meta={
          <span className="text-[12.5px] text-fg-subtle">
            {total} {total === 1 ? 'Seite' : 'Seiten'}
            {hasFilters ? ' (gefiltert)' : ''}
          </span>
        }
      />

      <SponsorPageFilters
        tournaments={tournaments}
        current={{ q: query, status: status ?? '', tournament: tournamentId ?? '', sort }}
      />

      {pages.length === 0 ? (
        <EmptyState
          className="mt-5"
          title={hasFilters ? 'Keine Seiten gefunden' : 'Noch keine Sponsorenseiten'}
          description={
            hasFilters
              ? 'Passen Sie die Filter an oder setzen Sie die Suche zurück.'
              : 'Erstellen Sie einen Sponsor – die passende Sponsorenseite entsteht dabei automatisch.'
          }
          action={
            hasFilters ? (
              <ButtonLink href="/admin/sponsor-pages" variant="secondary">
                Filter zurücksetzen
              </ButtonLink>
            ) : (
              <ButtonLink href="/admin/sponsors/new">Sponsor erstellen</ButtonLink>
            )
          }
        />
      ) : (
        <>
          <ul className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3 [&>li]:min-w-0">
            {pages.map((entry) => (
              <li key={entry.id}>
                <Card className="flex h-full flex-col transition-colors hover:border-line-strong">
                  <Link href={`/admin/sponsor-pages/${entry.id}`} className="flex flex-1 flex-col px-5 py-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-[14.5px] font-medium text-fg">{entry.title}</p>
                        <p className="mt-0.5 truncate text-[12.5px] text-fg-subtle">{entry.sponsor.companyName}</p>
                      </div>
                      <Badge tone={PAGE_STATUS[entry.status].tone} dot>
                        {PAGE_STATUS[entry.status].label}
                      </Badge>
                    </div>

                    <p className="mt-3 truncate font-mono text-[11.5px] text-fg-subtle">
                      {env.appUrl.replace(/^https?:\/\//, '')}/partner/{entry.slug}
                    </p>

                    <div className="mt-3.5 flex flex-wrap items-center gap-1.5">
                      {entry.visibility === 'PASSWORD_PROTECTED' ? (
                        <Badge tone={PAGE_VISIBILITY.PASSWORD_PROTECTED.tone}>Passwort</Badge>
                      ) : null}
                      <Badge tone="neutral">{SUPPORT_TYPE[entry.requestedSupportType].label}</Badge>
                      {entry.requestedAmount ? (
                        <Badge tone="brand">{formatAmount(entry.requestedAmount, entry.currency)}</Badge>
                      ) : null}
                    </div>

                    <div className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-1 pt-4 text-[12px] text-fg-subtle">
                      <span>{entry._count.sections} Sektionen</span>
                      <span>{entry._count.benefits} Leistungen</span>
                      {entry.viewCount > 0 ? <span>{entry.viewCount} Aufrufe</span> : null}
                      <span className="ml-auto">{formatDate(entry.updatedAt)}</span>
                    </div>
                  </Link>

                  {entry.tournament ? (
                    <p className="truncate border-t border-line px-5 py-2.5 text-[12px] text-fg-subtle">
                      {entry.tournament.title}
                    </p>
                  ) : null}
                </Card>
              </li>
            ))}
          </ul>

          <Pagination page={page} totalPages={totalPages} total={total} pageSize={PAGE_SIZE} className="mt-5" />
        </>
      )}
    </>
  )
}
