import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { PageHeader } from '@/components/ui/PageHeader'
import { prisma } from '@/lib/db'
import { requireUser } from '@/lib/session'

import { CreatePageForm } from './CreatePageForm'

export const metadata: Metadata = { title: 'Sponsorenseite erstellen' }
export const dynamic = 'force-dynamic'

export default async function CreateSponsorPageRoute({ params }: { params: Promise<{ id: string }> }) {
  await requireUser()
  const { id } = await params

  const sponsor = await prisma.sponsor.findUnique({
    where: { id },
    select: { id: true, companyName: true, slug: true },
  })
  if (!sponsor) notFound()

  const [benefits, templates, tournaments, templateDefaults] = await Promise.all([
    prisma.sponsoringBenefit.findMany({ orderBy: [{ order: 'asc' }, { title: 'asc' }] }),
    prisma.pageTemplate.findMany({
      where: { active: true },
      orderBy: { order: 'asc' },
      include: { _count: { select: { defaultBenefits: true } } },
    }),
    prisma.tournament.findMany({
      where: { status: { not: 'ARCHIVED' } },
      orderBy: [{ order: 'asc' }, { title: 'asc' }],
    }),
    prisma.pageTemplateBenefit.findMany({ orderBy: { order: 'asc' }, select: { templateId: true, benefitId: true } }),
  ])

  const defaultsByTemplate: Record<string, string[]> = {}
  for (const entry of templateDefaults) {
    ;(defaultsByTemplate[entry.templateId] ??= []).push(entry.benefitId)
  }

  return (
    <>
      <PageHeader
        title="Sponsorenseite erstellen"
        description={`Neue individuelle Seite für ${sponsor.companyName}.`}
        breadcrumbs={[
          { label: 'Sponsoren', href: '/admin/sponsors' },
          { label: sponsor.companyName, href: `/admin/sponsors/${sponsor.id}` },
          { label: 'Seite erstellen' },
        ]}
      />
      <CreatePageForm
        sponsor={sponsor}
        benefits={benefits}
        templates={templates}
        tournaments={tournaments}
        defaultsByTemplate={defaultsByTemplate}
      />
    </>
  )
}
