import type { Metadata } from 'next'
import Link from 'next/link'
import type { Prisma, TournamentStatus } from '@prisma/client'

import { Badge } from '@/components/ui/Badge'
import { ButtonLink } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { PageHeader } from '@/components/ui/PageHeader'
import { MediaThumb } from '@/components/admin/MediaThumb'
import { TournamentFilters } from '@/components/admin/TournamentFilters'
import { prisma } from '@/lib/db'
import { formatDateRange, formatNumber } from '@/lib/format'
import { TOURNAMENT_STATUS, TOURNAMENT_STATUS_ORDER } from '@/lib/labels'
import { requireUser } from '@/lib/session'

export const metadata: Metadata = { title: 'Turniere' }
export const dynamic = 'force-dynamic'

export default async function TournamentsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; game?: string }>
}) {
  await requireUser()
  const params = await searchParams

  const query = params.q?.trim() ?? ''
  const status = TOURNAMENT_STATUS_ORDER.includes(params.status as TournamentStatus)
    ? (params.status as TournamentStatus)
    : undefined
  const game = params.game?.trim() || undefined

  const where: Prisma.TournamentWhereInput = {
    ...(status ? { status } : {}),
    ...(game ? { game } : {}),
    ...(query
      ? {
          OR: [
            { title: { contains: query, mode: 'insensitive' } },
            { game: { contains: query, mode: 'insensitive' } },
          ],
        }
      : {}),
  }

  const [tournaments, games] = await Promise.all([
    prisma.tournament.findMany({
      where,
      orderBy: [{ order: 'asc' }, { startDate: 'desc' }, { title: 'asc' }],
      include: {
        heroImage: true,
        _count: { select: { pages: true, media: true } },
      },
    }),
    prisma.tournament.findMany({ distinct: ['game'], select: { game: true }, orderBy: { game: 'asc' } }),
  ])

  const hasFilters = Boolean(query || status || game)

  return (
    <>
      <PageHeader
        title="Turniere"
        description="Alle SwissHub-Turniere – vergangene, laufende und geplante."
        actions={<ButtonLink href="/admin/tournaments/new">Turnier erstellen</ButtonLink>}
        meta={
          <span className="text-[12.5px] text-fg-subtle">
            {tournaments.length} {tournaments.length === 1 ? 'Turnier' : 'Turniere'}
            {hasFilters ? ' (gefiltert)' : ''}
          </span>
        }
      />

      <TournamentFilters
        games={games.map((row) => row.game)}
        current={{ q: query, status: status ?? '', game: game ?? '' }}
      />

      {tournaments.length === 0 ? (
        <EmptyState
          className="mt-5"
          title={hasFilters ? 'Keine Turniere gefunden' : 'Noch keine Turniere erfasst'}
          description={
            hasFilters
              ? 'Passen Sie die Filter an oder setzen Sie die Suche zurück.'
              : 'Legen Sie das erste Turnier an, um es Sponsorenseiten zuordnen zu können.'
          }
          action={
            hasFilters ? (
              <ButtonLink href="/admin/tournaments" variant="secondary">
                Filter zurücksetzen
              </ButtonLink>
            ) : (
              <ButtonLink href="/admin/tournaments/new">Turnier erstellen</ButtonLink>
            )
          }
        />
      ) : (
        <ul className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3 [&>li]:min-w-0">
          {tournaments.map((tournament) => (
            <li key={tournament.id}>
              <Card className="h-full transition-colors hover:border-line-strong">
                <Link href={`/admin/tournaments/${tournament.id}`} className="block">
                  <div className="relative aspect-[16/9] overflow-hidden rounded-t-card bg-surface-raised">
                    {tournament.heroImage ? (
                      <MediaThumb
                        media={tournament.heroImage}
                        contain={false}
                        className="h-full w-full rounded-none border-0"
                      />
                    ) : (
                      <div className="brand-glow flex h-full items-center justify-center">
                        <span className="font-display text-[13px] font-semibold uppercase tracking-[0.16em] text-fg-subtle">
                          {tournament.game}
                        </span>
                      </div>
                    )}
                    <span className="absolute right-3 top-3">
                      <Badge tone={TOURNAMENT_STATUS[tournament.status].tone} dot>
                        {TOURNAMENT_STATUS[tournament.status].label}
                      </Badge>
                    </span>
                  </div>

                  <div className="px-5 py-4">
                    <p className="truncate text-[14.5px] font-medium text-fg">{tournament.title}</p>
                    <p className="mt-0.5 truncate text-[12.5px] text-fg-subtle">
                      {tournament.game}
                      {formatDateRange(tournament.startDate, tournament.endDate)
                        ? ` · ${formatDateRange(tournament.startDate, tournament.endDate)}`
                        : ''}
                    </p>

                    <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[12px] text-fg-subtle">
                      {tournament.participantCount ? (
                        <span>{formatNumber(tournament.participantCount)} Teilnehmende</span>
                      ) : tournament.expectedParticipantCount ? (
                        <span>~{formatNumber(tournament.expectedParticipantCount)} erwartet</span>
                      ) : null}
                      {tournament.streamViewerCount ? (
                        <span>Ø {formatNumber(tournament.streamViewerCount)} Zuschauer</span>
                      ) : null}
                      {tournament._count.pages > 0 ? <span>{tournament._count.pages} Seiten</span> : null}
                      {!tournament.featured ? <span className="text-warning">Nicht öffentlich</span> : null}
                    </div>
                  </div>
                </Link>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </>
  )
}
