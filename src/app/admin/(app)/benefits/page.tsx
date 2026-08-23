import type { Metadata } from 'next'

import { PageHeader } from '@/components/ui/PageHeader'
import { BenefitCatalogue } from '@/components/admin/BenefitCatalogue'
import { prisma } from '@/lib/db'
import { requireUser } from '@/lib/session'

export const metadata: Metadata = { title: 'Leistungen' }
export const dynamic = 'force-dynamic'

export default async function BenefitsPage() {
  await requireUser()

  const benefits = await prisma.sponsoringBenefit.findMany({
    orderBy: [{ order: 'asc' }, { title: 'asc' }],
    include: { _count: { select: { pageBenefits: true } } },
  })

  return (
    <>
      <PageHeader
        title="Leistungskatalog"
        description="Modularer Katalog aller Leistungen, die Sponsoren erhalten können. Wird beim Erstellen einer Sponsorenseite per Checkbox ausgewählt."
        meta={
          <span className="text-[12.5px] text-fg-subtle">
            {benefits.filter((benefit) => benefit.active).length} aktiv · {benefits.length} insgesamt
          </span>
        }
      />
      <BenefitCatalogue
        benefits={benefits.map((benefit) => ({
          id: benefit.id,
          title: benefit.title,
          description: benefit.description ?? '',
          category: benefit.category,
          icon: benefit.icon ?? '',
          active: benefit.active,
          defaultBenefit: benefit.defaultBenefit,
          usageCount: benefit._count.pageBenefits,
        }))}
      />
    </>
  )
}
