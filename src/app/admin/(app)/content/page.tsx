import type { Metadata } from 'next'

import { ButtonLink } from '@/components/ui/Button'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { PageHeader } from '@/components/ui/PageHeader'
import { SiteContentEditor } from '@/components/admin/SiteContentEditor'
import { prisma } from '@/lib/db'
import { parseSectionData } from '@/lib/section-data'
import { requireUser } from '@/lib/session'

export const metadata: Metadata = { title: 'Inhalte' }
export const dynamic = 'force-dynamic'

export default async function ContentPage() {
  await requireUser()

  const [sections, tournaments, partners] = await Promise.all([
    prisma.siteSection.findMany({ orderBy: { order: 'asc' } }),
    prisma.tournament.findMany({
      where: { status: { not: 'ARCHIVED' } },
      orderBy: [{ order: 'asc' }, { title: 'asc' }],
      select: { id: true, title: true, game: true },
    }),
    prisma.partnerReference.findMany({ orderBy: { order: 'asc' }, select: { id: true, name: true } }),
  ])

  const galleryIds = new Set<string>()
  for (const section of sections) {
    for (const item of parseSectionData(section.data).gallery ?? []) {
      if (item.mediaId) galleryIds.add(item.mediaId)
    }
  }
  const galleryMedia = galleryIds.size
    ? await prisma.media.findMany({ where: { id: { in: [...galleryIds] } } })
    : []

  return (
    <>
      <PageHeader
        title="Inhalte der öffentlichen Seite"
        description="Alle Sektionen der öffentlichen Sponsoring-Seite – editierbar, sortierbar und einzeln ein- oder ausblendbar."
        actions={
          <ButtonLink href="/" target="_blank" rel="noopener noreferrer" variant="secondary">
            Seite ansehen
          </ButtonLink>
        }
      />

      <Card>
        <CardHeader
          title="Sektionen"
          description="Die Reihenfolge hier entspricht der Reihenfolge auf der öffentlichen Seite."
        />
        <CardBody>
          <SiteContentEditor
            sections={sections.map((section) => ({
              id: section.id,
              type: section.type,
              title: section.title ?? '',
              subtitle: section.subtitle ?? '',
              content: section.content ?? '',
              data: parseSectionData(section.data),
              visible: section.visible,
            }))}
            tournaments={tournaments}
            partners={partners}
            galleryMedia={galleryMedia}
          />
        </CardBody>
      </Card>
    </>
  )
}
