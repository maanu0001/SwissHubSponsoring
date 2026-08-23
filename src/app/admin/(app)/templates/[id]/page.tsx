import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { PageHeader } from '@/components/ui/PageHeader'
import { TemplateEditor } from '@/components/admin/TemplateEditor'
import { prisma } from '@/lib/db'
import { requireUser } from '@/lib/session'
import { parseTemplateStructure } from '@/server/page-builder'

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const template = await prisma.pageTemplate.findUnique({ where: { id }, select: { name: true } })
  return { title: template?.name ?? 'Template' }
}

export default async function TemplateDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireUser()
  const { id } = await params

  const template = await prisma.pageTemplate.findUnique({
    where: { id },
    include: {
      defaultBenefits: { orderBy: { order: 'asc' }, select: { benefitId: true } },
      _count: { select: { pages: true } },
    },
  })
  if (!template) notFound()

  const [benefits, tournaments, partners] = await Promise.all([
    prisma.sponsoringBenefit.findMany({ orderBy: [{ order: 'asc' }, { title: 'asc' }] }),
    prisma.tournament.findMany({
      where: { status: { not: 'ARCHIVED' } },
      orderBy: [{ order: 'asc' }, { title: 'asc' }],
      select: { id: true, title: true, game: true },
    }),
    prisma.partnerReference.findMany({ orderBy: { order: 'asc' }, select: { id: true, name: true } }),
  ])

  return (
    <>
      <PageHeader
        title={template.name}
        description={template.description ?? 'Ausgangspunkt für neue Sponsorenseiten.'}
        breadcrumbs={[{ label: 'Templates', href: '/admin/templates' }, { label: template.name }]}
        meta={
          <span className="text-[12.5px] text-fg-subtle">
            {template._count.pages} Seite(n) mit diesem Template erstellt
          </span>
        }
      />
      <TemplateEditor
        template={{
          id: template.id,
          name: template.name,
          slug: template.slug,
          description: template.description ?? '',
          type: template.type,
          active: template.active,
          pageCount: template._count.pages,
        }}
        sections={parseTemplateStructure(template.structure).map((section, index) => ({
          id: `blueprint-${index}`,
          type: section.type,
          title: section.title,
          subtitle: section.subtitle,
          content: section.content,
          data: section.data,
          visible: section.visible,
        }))}
        defaultBenefitIds={template.defaultBenefits.map((entry) => entry.benefitId)}
        benefits={benefits}
        tournaments={tournaments}
        partners={partners}
      />
    </>
  )
}
