import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { PublicFooter } from '@/components/public/PublicFooter'
import { SectionRenderer } from '@/components/public/SectionRenderer'
import { prisma } from '@/lib/db'
import { requireUser } from '@/lib/session'
import { buildRenderContext, galleryMediaFor, toRenderSections, tournamentsByIds } from '@/server/render'

export const metadata: Metadata = {
  title: 'Vorschau',
  robots: { index: false, follow: false, nocache: true },
}

export const dynamic = 'force-dynamic'

/**
 * Renders a sponsor page with the exact same components as the public route,
 * but behind the admin guard and without recording a page view. Drafts and
 * hidden sections are shown so the admin sees the full result.
 */
export default async function SponsorPagePreview({ params }: { params: Promise<{ id: string }> }) {
  await requireUser()
  const { id } = await params

  const page = await prisma.sponsorPage.findUnique({
    where: { id },
    include: {
      sponsor: { include: { logo: true } },
      heroImage: true,
      sections: { orderBy: { order: 'asc' } },
      benefits: { where: { visible: true }, orderBy: { order: 'asc' }, include: { benefit: true } },
    },
  })

  if (!page) notFound()

  const sections = toRenderSections(page.sections)

  const tournamentIds = new Set<string>()
  if (page.tournamentId) tournamentIds.add(page.tournamentId)
  for (const section of sections) {
    for (const tournamentId of section.data.tournamentIds ?? []) tournamentIds.add(tournamentId)
  }

  const [galleryMedia, extraTournaments] = await Promise.all([
    galleryMediaFor(sections),
    tournamentsByIds([...tournamentIds]),
  ])

  const context = await buildRenderContext({
    sections,
    benefits: page.benefits.map((entry) => ({
      id: entry.id,
      title: entry.customTitle || entry.benefit.title,
      description: entry.customDescription || entry.benefit.description,
      category: entry.benefit.category,
    })),
    sponsor: {
      id: page.sponsor.id,
      companyName: page.sponsor.companyName,
      website: page.sponsor.website,
      logo: page.sponsor.logo,
    },
    page: {
      id: page.id,
      slug: page.slug,
      title: page.title,
      subtitle: page.subtitle,
      requestedSupportType: page.requestedSupportType,
      requestedSupportText: page.requestedSupportText,
      currency: page.currency,
      requestedAmount: page.requestedAmount ? Number(page.requestedAmount) : null,
      heroImage: page.heroImage,
      tournamentId: page.tournamentId,
    },
    extraTournaments,
  })

  return (
    <>
      <main id="main">
        {context.sections.length === 0 ? (
          <div className="container-content py-24 text-center">
            <p className="text-[15px] text-fg-muted">
              Diese Seite hat noch keine sichtbaren Sektionen. Fügen Sie im Editor Sektionen hinzu.
            </p>
          </div>
        ) : (
          context.sections.map((section, index) => (
            <SectionRenderer
              key={section.id}
              section={section}
              context={context}
              index={index}
              galleryMedia={galleryMedia}
            />
          ))
        )}
      </main>
      <PublicFooter brandName={context.brand.name} contact={context.contact} />
    </>
  )
}
