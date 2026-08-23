import type { Metadata } from 'next'
import type { ActivityAction, Prisma } from '@prisma/client'

import { Badge } from '@/components/ui/Badge'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { Pagination } from '@/components/admin/Pagination'
import { ActivityFilters } from '@/components/admin/ActivityFilters'
import { prisma } from '@/lib/db'
import { formatDateTime } from '@/lib/format'
import { ACTIVITY_ACTION } from '@/lib/labels'
import { requireUser } from '@/lib/session'

export const metadata: Metadata = { title: 'Aktivitätsprotokoll' }
export const dynamic = 'force-dynamic'

const PAGE_SIZE = 50

export default async function ActivityPage({
  searchParams,
}: {
  searchParams: Promise<{ action?: string; entity?: string; page?: string }>
}) {
  await requireUser()
  const params = await searchParams

  const action = params.action && params.action in ACTIVITY_ACTION ? (params.action as ActivityAction) : undefined
  const entity = params.entity?.trim() || undefined
  const page = Math.max(1, Number.parseInt(params.page ?? '1', 10) || 1)

  const where: Prisma.ActivityLogWhereInput = {
    ...(action ? { action } : {}),
    ...(entity ? { entityType: entity } : {}),
  }

  const [entries, total, entityTypes] = await Promise.all([
    prisma.activityLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: { user: { select: { name: true, email: true } } },
    }),
    prisma.activityLog.count({ where }),
    prisma.activityLog.findMany({ distinct: ['entityType'], select: { entityType: true }, orderBy: { entityType: 'asc' } }),
  ])

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader
          title="Aktivitätsprotokoll"
          description="Alle relevanten Änderungen im Adminbereich. Passwörter und Tokens werden niemals protokolliert."
        />
        <CardBody className="space-y-4">
          <ActivityFilters
            entityTypes={entityTypes.map((row) => row.entityType)}
            current={{ action: action ?? '', entity: entity ?? '' }}
          />

          {entries.length === 0 ? (
            <EmptyState compact title="Keine Einträge" description="Für die gewählten Filter gibt es keine Aktivitäten." />
          ) : (
            <ul className="divide-y divide-line">
              {entries.map((entry) => (
                <li key={entry.id} className="flex flex-wrap items-start justify-between gap-3 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-[13.5px] text-fg">{entry.summary}</p>
                    <p className="mt-0.5 text-[12px] text-fg-subtle">
                      {formatDateTime(entry.createdAt)}
                      {entry.user ? ` · ${entry.user.name}` : ' · System'}
                      {` · ${entry.entityType}`}
                    </p>
                  </div>
                  <Badge tone={ACTIVITY_ACTION[entry.action].tone}>{ACTIVITY_ACTION[entry.action].label}</Badge>
                </li>
              ))}
            </ul>
          )}

          <Pagination page={page} totalPages={totalPages} total={total} pageSize={PAGE_SIZE} />
        </CardBody>
      </Card>
    </div>
  )
}
