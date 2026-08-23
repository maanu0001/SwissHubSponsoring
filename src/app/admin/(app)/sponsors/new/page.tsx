import type { Metadata } from 'next'

import { PageHeader } from '@/components/ui/PageHeader'
import { prisma } from '@/lib/db'
import { requireUser } from '@/lib/session'

import { SponsorWizard } from './SponsorWizard'

export const metadata: Metadata = { title: 'Neuen Sponsor erstellen' }
export const dynamic = 'force-dynamic'

export default async function NewSponsorPage() {
  await requireUser('/admin/sponsors/new')

  const [benefits, templates, tournaments, industries] = await Promise.all([
    prisma.sponsoringBenefit.findMany({ orderBy: [{ order: 'asc' }, { title: 'asc' }] }),
    prisma.pageTemplate.findMany({
      where: { active: true },
      orderBy: { order: 'asc' },
      include: { _count: { select: { defaultBenefits: true } } },
    }),
    prisma.tournament.findMany({
      where: { status: { not: 'ARCHIVED' } },
      orderBy: [{ status: 'asc' }, { order: 'asc' }, { title: 'asc' }],
    }),
    prisma.sponsor.findMany({
      where: { industry: { not: null } },
      distinct: ['industry'],
      select: { industry: true },
      orderBy: { industry: 'asc' },
    }),
  ])

  const templateDefaults = await prisma.pageTemplateBenefit.findMany({
    orderBy: { order: 'asc' },
    select: { templateId: true, benefitId: true },
  })

  const defaultsByTemplate: Record<string, string[]> = {}
  for (const entry of templateDefaults) {
    ;(defaultsByTemplate[entry.templateId] ??= []).push(entry.benefitId)
  }

  return (
    <>
      <PageHeader
        title="Neuen Sponsor erstellen"
        description="In sechs Schritten vom Unternehmen zur fertigen, individuellen Sponsorenseite."
        breadcrumbs={[{ label: 'Sponsoren', href: '/admin/sponsors' }, { label: 'Neu' }]}
      />
      <SponsorWizard
        benefits={benefits}
        templates={templates}
        tournaments={tournaments}
        defaultsByTemplate={defaultsByTemplate}
        knownIndustries={industries.map((row) => row.industry).filter((value): value is string => Boolean(value))}
      />
    </>
  )
}
