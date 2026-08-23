import type { Metadata } from 'next'
import type { MediaType, Prisma } from '@prisma/client'

import { PageHeader } from '@/components/ui/PageHeader'
import { Pagination } from '@/components/admin/Pagination'
import { MediaLibrary } from '@/components/admin/MediaLibrary'
import { prisma } from '@/lib/db'
import { env } from '@/lib/env'
import { requireUser } from '@/lib/session'

export const metadata: Metadata = { title: 'Medien' }
export const dynamic = 'force-dynamic'

const PAGE_SIZE = 36

export default async function MediaPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; type?: string; source?: string; page?: string }>
}) {
  await requireUser()
  const params = await searchParams

  const query = params.q?.trim() ?? ''
  const type = ['IMAGE', 'VIDEO', 'DOCUMENT'].includes(params.type ?? '') ? (params.type as MediaType) : undefined
  const source = params.source === 'UPLOAD' || params.source === 'EXTERNAL' ? params.source : undefined
  const page = Math.max(1, Number.parseInt(params.page ?? '1', 10) || 1)

  const where: Prisma.MediaWhereInput = {
    ...(type ? { type } : {}),
    ...(source ? { sourceType: source } : {}),
    ...(query
      ? {
          OR: [
            { title: { contains: query, mode: 'insensitive' } },
            { altText: { contains: query, mode: 'insensitive' } },
          ],
        }
      : {}),
  }

  const [media, total] = await Promise.all([
    prisma.media.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.media.count({ where }),
  ])

  const maxMb = Math.round(env.maxUploadSize / (1024 * 1024))
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  return (
    <>
      <PageHeader
        title="Medienverwaltung"
        description="Bilder, Logos und Dokumente – als Upload auf dem Server oder als externe URL."
        meta={
          <span className="text-[12.5px] text-fg-subtle">
            {total} {total === 1 ? 'Eintrag' : 'Einträge'} · max. {maxMb} MB pro Datei
          </span>
        }
      />
      <MediaLibrary
        media={media}
        current={{ q: query, type: type ?? '', source: source ?? '' }}
        maxUploadMb={maxMb}
      />
      <Pagination page={page} totalPages={totalPages} total={total} pageSize={PAGE_SIZE} className="mt-5" />
    </>
  )
}
