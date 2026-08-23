import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { PublicFooter } from '@/components/public/PublicFooter'
import { SectionRenderer } from '@/components/public/SectionRenderer'
import { prisma } from '@/lib/db'
import { hasPageAccess } from '@/lib/page-access'
import { buildMetadata } from '@/lib/metadata'
import { toPlainText } from '@/lib/sanitize'
import { buildRenderContext, galleryMediaFor, toRenderSections, tournamentsByIds } from '@/server/render'
import { recordPageView } from '@/server/analytics'

import { PasswordGate } from './PasswordGate'

export const dynamic = 'force-dynamic'

async function loadPage(slug: string) {
  return prisma.sponsorPage.findUnique({
    where: { slug },
    include: {
      sponsor: { include: { logo: true } },
      heroImage: true,
      sections: { orderBy: { order: 'asc' } },
      benefits: {
        where: { visible: true },
        orderBy: { order: 'asc' },
        include: { benefit: true },
      },
    },
  })
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const page = await prisma.sponsorPage.findUnique({
    where: { slug },
    select: { title: true, subtitle: true, status: true, noindex: true, heroImageId: true },
  })

  if (!page || page.status !== 'PUBLISHED') {
    return { title: 'Nicht verfügbar', robots: { index: false, follow: false } }
  }

  return buildMetadata({
    title: page.title,
    description: page.subtitle ?? undefined,
    path: `/partner/${slug}`,
    // Individual sponsor pages are excluded from search engines by default.
    noindex: page.noindex,
    imageMediaId: page.heroImageId,
  })
}

export default async function PartnerPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const page = await loadPage(slug)

  // Drafts and archived pages are never publicly reachable.
  if (!page || page.status !== 'PUBLISHED') notFound()

  if (page.visibility === 'PASSWORD_PROTECTED') {
    const allowed = await hasPageAccess(page.id, page.passwordHash)
    if (!allowed) {
      return <PasswordGate slug={slug} title={page.title} sponsorName={page.sponsor.companyName} />
    }
  }

  const sections = toRenderSections(page.sections)

  const referencedTournamentIds = new Set<string>()
  if (page.tournamentId) referencedTournamentIds.add(page.tournamentId)
  for (const section of sections) {
    for (const id of section.data.tournamentIds ?? []) referencedTournamentIds.add(id)
  }

  const [galleryMedia, extraTournaments] = await Promise.all([
    galleryMediaFor(sections),
    tournamentsByIds([...referencedTournamentIds]),
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

  // Privacy friendly, aggregated only – no IP, no cookie, no fingerprint.
  await recordPageView(page.id)

  return (
    <>
      <main id="main">
        {context.sections.map((section, index) => (
          <SectionRenderer
            key={section.id}
            section={section}
            context={context}
            index={index}
            galleryMedia={galleryMedia}
          />
        ))}
      </main>
      <PublicFooter
        brandName={context.brand.name}
        contact={context.contact}
        note={toPlainText(page.subtitle, 160)}
      />
    </>
  )
}
