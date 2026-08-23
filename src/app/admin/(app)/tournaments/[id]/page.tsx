import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { Badge } from '@/components/ui/Badge'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { PageHeader } from '@/components/ui/PageHeader'
import { TournamentForm } from '@/components/admin/TournamentForm'
import { prisma } from '@/lib/db'
import { formatDate } from '@/lib/format'
import { PAGE_STATUS, TOURNAMENT_STATUS } from '@/lib/labels'
import { requireUser } from '@/lib/session'

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const tournament = await prisma.tournament.findUnique({ where: { id }, select: { title: true } })
  return { title: tournament?.title ?? 'Turnier' }
}

export default async function TournamentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireUser()
  const { id } = await params

  const tournament = await prisma.tournament.findUnique({
    where: { id },
    include: {
      heroImage: true,
      media: { orderBy: { order: 'asc' }, include: { mediaItem: true } },
      pages: {
        orderBy: { updatedAt: 'desc' },
        include: { sponsor: { select: { companyName: true } } },
      },
    },
  })

  if (!tournament) notFound()

  return (
    <>
      <PageHeader
        title={tournament.title}
        breadcrumbs={[{ label: 'Turniere', href: '/admin/tournaments' }, { label: tournament.title }]}
        description={tournament.game}
        meta={
          <>
            <Badge tone={TOURNAMENT_STATUS[tournament.status].tone} dot>
              {TOURNAMENT_STATUS[tournament.status].label}
            </Badge>
            <span className="text-[12.5px] text-fg-subtle">Erstellt: {formatDate(tournament.createdAt)}</span>
          </>
        }
      />

      <div className="grid gap-5 lg:grid-cols-[1.5fr_1fr] [&>*]:min-w-0">
        <TournamentForm
          tournament={tournament}
          gallery={tournament.media.map((entry) => entry.mediaItem)}
          linkedPages={tournament.pages.length}
        />

        <Card className="h-fit">
          <CardHeader
            title="Zugeordnete Sponsorenseiten"
            description="Sponsorenseiten, die auf dieses Turnier verweisen."
          />
          <CardBody className="p-0">
            {tournament.pages.length === 0 ? (
              <p className="px-5 py-6 text-[13px] text-fg-subtle">
                Diesem Turnier ist noch keine Sponsorenseite zugeordnet.
              </p>
            ) : (
              <ul className="divide-y divide-line">
                {tournament.pages.map((page) => (
                  <li key={page.id}>
                    <Link
                      href={`/admin/sponsor-pages/${page.id}`}
                      className="flex items-center justify-between gap-3 px-5 py-3 transition-colors hover:bg-surface-raised"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-[13.5px] text-fg">{page.sponsor.companyName}</p>
                        <p className="truncate text-[12px] text-fg-subtle">/partner/{page.slug}</p>
                      </div>
                      <Badge tone={PAGE_STATUS[page.status].tone}>{PAGE_STATUS[page.status].label}</Badge>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>
      </div>
    </>
  )
}
