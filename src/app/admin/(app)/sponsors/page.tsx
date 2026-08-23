import type { Metadata } from 'next'
import Link from 'next/link'
import type { Prisma, SponsorStatus } from '@prisma/client'

import { ButtonLink } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { PageHeader } from '@/components/ui/PageHeader'
import { MediaThumb } from '@/components/admin/MediaThumb'
import { SponsorFilters } from '@/components/admin/SponsorFilters'
import { Pagination } from '@/components/admin/Pagination'
import { prisma } from '@/lib/db'
import { formatDate } from '@/lib/format'
import { PAGE_STATUS, SPONSOR_STATUS, SPONSOR_STATUS_ORDER } from '@/lib/labels'
import { displayUrl } from '@/lib/media'

export const metadata: Metadata = { title: 'Sponsoren' }
export const dynamic = 'force-dynamic'

const PAGE_SIZE = 25

type SortKey = 'updated' | 'name' | 'status' | 'contact'

const SORTS: Record<SortKey, Prisma.SponsorOrderByWithRelationInput[]> = {
  updated: [{ updatedAt: 'desc' }],
  name: [{ companyName: 'asc' }],
  status: [{ status: 'asc' }, { companyName: 'asc' }],
  contact: [{ lastContactDate: { sort: 'desc', nulls: 'last' } }, { companyName: 'asc' }],
}

export interface SponsorSearchParams {
  q?: string
  status?: string
  industry?: string
  tournament?: string
  from?: string
  to?: string
  sort?: string
  page?: string
}

export default async function SponsorsPage({
  searchParams,
}: {
  searchParams: Promise<SponsorSearchParams>
}) {
  const params = await searchParams

  const query = params.q?.trim() ?? ''
  const status = SPONSOR_STATUS_ORDER.includes(params.status as SponsorStatus)
    ? (params.status as SponsorStatus)
    : undefined
  const industry = params.industry?.trim() || undefined
  const tournamentId = params.tournament?.trim() || undefined
  const sort: SortKey = (['updated', 'name', 'status', 'contact'] as const).includes(params.sort as SortKey)
    ? (params.sort as SortKey)
    : 'updated'
  const page = Math.max(1, Number.parseInt(params.page ?? '1', 10) || 1)

  const fromDate = params.from ? new Date(params.from) : null
  const toDate = params.to ? new Date(params.to) : null
  const validFrom = fromDate && !Number.isNaN(fromDate.getTime()) ? fromDate : null
  const validTo = toDate && !Number.isNaN(toDate.getTime()) ? new Date(toDate.setHours(23, 59, 59, 999)) : null

  const where: Prisma.SponsorWhereInput = {
    ...(status ? { status } : {}),
    ...(industry ? { industry } : {}),
    ...(tournamentId ? { pages: { some: { tournamentId } } } : {}),
    ...(validFrom || validTo
      ? { lastContactDate: { ...(validFrom ? { gte: validFrom } : {}), ...(validTo ? { lte: validTo } : {}) } }
      : {}),
    ...(query
      ? {
          OR: [
            { companyName: { contains: query, mode: 'insensitive' } },
            { contactName: { contains: query, mode: 'insensitive' } },
            { contactEmail: { contains: query, mode: 'insensitive' } },
          ],
        }
      : {}),
  }

  const [sponsors, total, industries, tournaments] = await Promise.all([
    prisma.sponsor.findMany({
      where,
      orderBy: SORTS[sort],
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: {
        logo: true,
        pages: {
          orderBy: { updatedAt: 'desc' },
          take: 1,
          select: { id: true, slug: true, status: true, tournament: { select: { title: true } } },
        },
      },
    }),
    prisma.sponsor.count({ where }),
    prisma.sponsor.findMany({
      where: { industry: { not: null } },
      distinct: ['industry'],
      select: { industry: true },
      orderBy: { industry: 'asc' },
    }),
    prisma.tournament.findMany({ orderBy: { title: 'asc' }, select: { id: true, title: true } }),
  ])

  const hasFilters = Boolean(query || status || industry || tournamentId || validFrom || validTo)
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  return (
    <>
      <PageHeader
        title="Sponsoren"
        description="Alle potenziellen und bestehenden Partner von SwissHub im Überblick."
        actions={<ButtonLink href="/admin/sponsors/new">Neuen Sponsor erstellen</ButtonLink>}
        meta={
          <span className="text-[12.5px] text-fg-subtle">
            {total} {total === 1 ? 'Eintrag' : 'Einträge'}
            {hasFilters ? ' (gefiltert)' : ''}
          </span>
        }
      />

      <SponsorFilters
        industries={industries.map((row) => row.industry).filter((value): value is string => Boolean(value))}
        tournaments={tournaments}
        current={{ q: query, status: status ?? '', industry: industry ?? '', tournament: tournamentId ?? '', from: params.from ?? '', to: params.to ?? '', sort }}
      />

      {sponsors.length === 0 ? (
        <EmptyState
          className="mt-5"
          title={hasFilters ? 'Keine Sponsoren gefunden' : 'Noch keine Sponsoren erfasst'}
          description={
            hasFilters
              ? 'Passen Sie die Filter an oder setzen Sie die Suche zurück.'
              : 'Legen Sie den ersten Sponsor an – danach erstellen Sie in wenigen Schritten eine individuelle Sponsorenseite.'
          }
          action={
            hasFilters ? (
              <ButtonLink href="/admin/sponsors" variant="secondary">
                Filter zurücksetzen
              </ButtonLink>
            ) : (
              <ButtonLink href="/admin/sponsors/new">Sponsor erstellen</ButtonLink>
            )
          }
        />
      ) : (
        <>
          {/* Table on large screens */}
          <Card className="mt-5 hidden overflow-hidden lg:block">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-[13.5px]">
                <thead>
                  <tr className="border-b border-line text-[12px] uppercase tracking-wide text-fg-subtle">
                    <th scope="col" className="px-5 py-3 font-medium">Unternehmen</th>
                    <th scope="col" className="px-4 py-3 font-medium">Ansprechpartner</th>
                    <th scope="col" className="px-4 py-3 font-medium">Turnier</th>
                    <th scope="col" className="px-4 py-3 font-medium">Letzter Kontakt</th>
                    <th scope="col" className="px-4 py-3 font-medium">Seite</th>
                    <th scope="col" className="px-5 py-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {sponsors.map((sponsor) => {
                    const page = sponsor.pages[0]
                    return (
                      <tr key={sponsor.id} className="transition-colors hover:bg-surface-raised">
                        <td className="px-5 py-3">
                          <Link href={`/admin/sponsors/${sponsor.id}`} className="flex items-center gap-3">
                            <MediaThumb media={sponsor.logo} className="h-9 w-9 shrink-0" fallback="—" />
                            <span className="min-w-0">
                              <span className="block truncate font-medium text-fg">{sponsor.companyName}</span>
                              <span className="block truncate text-[12px] text-fg-subtle">
                                {sponsor.industry || 'Keine Branche'}
                                {sponsor.website ? ` · ${displayUrl(sponsor.website)}` : ''}
                              </span>
                            </span>
                          </Link>
                        </td>
                        <td className="px-4 py-3">
                          {sponsor.contactName || sponsor.contactEmail ? (
                            <>
                              <span className="block truncate text-fg-muted">{sponsor.contactName || '—'}</span>
                              {sponsor.contactEmail ? (
                                <a
                                  href={`mailto:${sponsor.contactEmail}`}
                                  className="block truncate text-[12px] text-brand-accent hover:underline"
                                >
                                  {sponsor.contactEmail}
                                </a>
                              ) : null}
                            </>
                          ) : (
                            <span className="text-fg-subtle">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-fg-muted">
                          {page?.tournament?.title ?? <span className="text-fg-subtle">—</span>}
                        </td>
                        <td className="px-4 py-3 tabular-nums text-fg-muted">{formatDate(sponsor.lastContactDate)}</td>
                        <td className="px-4 py-3">
                          {page ? (
                            <Link href={`/admin/sponsor-pages/${page.id}`}>
                              <Badge tone={PAGE_STATUS[page.status].tone}>{PAGE_STATUS[page.status].label}</Badge>
                            </Link>
                          ) : (
                            <Link
                              href={`/admin/sponsors/${sponsor.id}/create-page`}
                              className="text-[12.5px] text-brand-accent hover:underline"
                            >
                              Seite erstellen
                            </Link>
                          )}
                        </td>
                        <td className="px-5 py-3">
                          <Badge tone={SPONSOR_STATUS[sponsor.status].tone} dot>
                            {SPONSOR_STATUS[sponsor.status].label}
                          </Badge>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Cards on small screens */}
          <ul className="mt-5 space-y-2.5 lg:hidden">
            {sponsors.map((sponsor) => {
              const page = sponsor.pages[0]
              return (
                <li key={sponsor.id}>
                  <Link
                    href={`/admin/sponsors/${sponsor.id}`}
                    className="block rounded-card border border-line bg-surface px-4 py-3.5 transition-colors hover:border-line-strong"
                  >
                    <div className="flex items-start gap-3">
                      <MediaThumb media={sponsor.logo} className="h-10 w-10 shrink-0" fallback="—" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[14px] font-medium text-fg">{sponsor.companyName}</p>
                        <p className="truncate text-[12.5px] text-fg-subtle">
                          {sponsor.industry || 'Keine Branche'}
                          {sponsor.contactName ? ` · ${sponsor.contactName}` : ''}
                        </p>
                      </div>
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <Badge tone={SPONSOR_STATUS[sponsor.status].tone} dot>
                        {SPONSOR_STATUS[sponsor.status].label}
                      </Badge>
                      {page ? (
                        <Badge tone={PAGE_STATUS[page.status].tone}>Seite: {PAGE_STATUS[page.status].label}</Badge>
                      ) : null}
                      {sponsor.lastContactDate ? (
                        <span className="text-[12px] text-fg-subtle">Kontakt: {formatDate(sponsor.lastContactDate)}</span>
                      ) : null}
                    </div>
                  </Link>
                </li>
              )
            })}
          </ul>

          <Pagination page={page} totalPages={totalPages} total={total} pageSize={PAGE_SIZE} className="mt-5" />
        </>
      )}
    </>
  )
}
