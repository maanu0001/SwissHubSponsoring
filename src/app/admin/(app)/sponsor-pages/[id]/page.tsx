import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { PageHeader } from '@/components/ui/PageHeader'
import { prisma } from '@/lib/db'
import { env } from '@/lib/env'
import { parseSectionData } from '@/lib/section-data'
import { requireUser } from '@/lib/session'
import { pageViewSeries } from '@/server/analytics'

import { SponsorPageEditor } from './SponsorPageEditor'

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const page = await prisma.sponsorPage.findUnique({ where: { id }, select: { title: true } })
  return { title: page?.title ?? 'Sponsorenseite' }
}

export default async function SponsorPageEditorRoute({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ created?: string; tab?: string }>
}) {
  await requireUser()
  const [{ id }, query] = await Promise.all([params, searchParams])

  const page = await prisma.sponsorPage.findUnique({
    where: { id },
    include: {
      sponsor: { select: { id: true, companyName: true, slug: true } },
      heroImage: true,
      template: { select: { id: true, name: true } },
      sections: { orderBy: { order: 'asc' } },
      benefits: { orderBy: { order: 'asc' }, include: { benefit: true } },
    },
  })

  if (!page) notFound()

  const [tournaments, partners, allBenefits, views] = await Promise.all([
    prisma.tournament.findMany({
      where: { status: { not: 'ARCHIVED' } },
      orderBy: [{ order: 'asc' }, { title: 'asc' }],
      select: { id: true, title: true, game: true, status: true },
    }),
    prisma.partnerReference.findMany({ orderBy: { order: 'asc' }, select: { id: true, name: true } }),
    prisma.sponsoringBenefit.findMany({ orderBy: [{ order: 'asc' }, { title: 'asc' }] }),
    pageViewSeries(id, 30),
  ])

  // Resolve every media item referenced by a gallery so the editor can preview it.
  const galleryIds = new Set<string>()
  for (const section of page.sections) {
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
        title={page.title}
        breadcrumbs={[
          { label: 'Sponsorenseiten', href: '/admin/sponsor-pages' },
          { label: page.sponsor.companyName, href: `/admin/sponsors/${page.sponsor.id}` },
          { label: 'Editor' },
        ]}
        description={`Individuelle Sponsoring-Seite für ${page.sponsor.companyName}.`}
      />

      <SponsorPageEditor
        page={{
          id: page.id,
          slug: page.slug,
          title: page.title,
          subtitle: page.subtitle ?? '',
          status: page.status,
          visibility: page.visibility,
          hasPassword: Boolean(page.passwordHash),
          requestedSupportType: page.requestedSupportType,
          requestedAmount: page.requestedAmount ? Number(page.requestedAmount) : null,
          requestedSupportText: page.requestedSupportText ?? '',
          currency: page.currency,
          heroImageId: page.heroImageId ?? '',
          noindex: page.noindex,
          tournamentId: page.tournamentId ?? '',
          viewCount: page.viewCount,
          lastViewedAt: page.lastViewedAt ? page.lastViewedAt.toISOString() : null,
          publishedAt: page.publishedAt ? page.publishedAt.toISOString() : null,
          templateName: page.template?.name ?? null,
          sponsorName: page.sponsor.companyName,
        }}
        heroImage={page.heroImage}
        sections={page.sections.map((section) => ({
          id: section.id,
          type: section.type,
          title: section.title ?? '',
          subtitle: section.subtitle ?? '',
          content: section.content ?? '',
          data: parseSectionData(section.data),
          visible: section.visible,
        }))}
        pageBenefits={page.benefits.map((entry) => ({
          id: entry.id,
          benefitId: entry.benefitId,
          title: entry.benefit.title,
          description: entry.benefit.description ?? '',
          category: entry.benefit.category,
          customTitle: entry.customTitle ?? '',
          customDescription: entry.customDescription ?? '',
          visible: entry.visible,
        }))}
        allBenefits={allBenefits}
        tournaments={tournaments}
        partners={partners}
        galleryMedia={galleryMedia}
        views={views.map((entry) => ({ day: entry.day.toISOString().slice(0, 10), count: entry.count }))}
        appUrl={env.appUrl}
        justCreated={query.created === '1'}
        initialTab={query.tab}
      />
    </>
  )
}
