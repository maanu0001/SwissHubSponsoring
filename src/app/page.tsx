import type { Metadata } from 'next'

import { PublicFooter } from '@/components/public/PublicFooter'
import { PublicHeader } from '@/components/public/PublicHeader'
import { SectionRenderer } from '@/components/public/SectionRenderer'
import { prisma } from '@/lib/db'
import { buildMetadata } from '@/lib/metadata'
import { buildRenderContext, galleryMediaFor, renderChrome, toRenderSections } from '@/server/render'

// Public content is cached and revalidated whenever the CMS writes.
export const revalidate = 300

export async function generateMetadata(): Promise<Metadata> {
  return buildMetadata({ path: '/' })
}

export default async function HomePage() {
  const [rows, benefits, chrome] = await Promise.all([
    prisma.siteSection.findMany({ orderBy: { order: 'asc' } }),
    prisma.sponsoringBenefit.findMany({
      where: { active: true },
      orderBy: [{ order: 'asc' }, { title: 'asc' }],
      select: { id: true, title: true, description: true, category: true },
    }),
    renderChrome(),
  ])

  const sections = toRenderSections(rows)
  const galleryMedia = await galleryMediaFor(sections)

  const context = await buildRenderContext({
    sections,
    benefits,
    sponsor: null,
    page: null,
  })

  const navSections = sections
    .filter((section) => section.type !== 'HERO' && section.title)
    .slice(0, 6)
    .map((section) => ({
      id: `section-${section.type.toLowerCase().replace(/_/g, '-')}-${section.id.slice(-6)}`,
      label: section.title ?? '',
    }))

  return (
    <>
      <PublicHeader
        brandName={context.brand.name}
        logo={context.brand.logo}
        sections={navSections}
        contactEmail={context.contact.email}
      />
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
        footerNote={chrome.settings['legal.footerNote']}
      />
    </>
  )
}
