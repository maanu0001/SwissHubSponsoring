import type { Metadata } from 'next'

import { PageHeader } from '@/components/ui/PageHeader'
import { PartnerManager } from '@/components/admin/PartnerManager'
import { prisma } from '@/lib/db'
import { requireUser } from '@/lib/session'

export const metadata: Metadata = { title: 'Partner / Referenzen' }
export const dynamic = 'force-dynamic'

export default async function PartnersPage() {
  await requireUser()

  const partners = await prisma.partnerReference.findMany({
    orderBy: { order: 'asc' },
    include: { logo: true },
  })

  return (
    <>
      <PageHeader
        title="Partner & Referenzen"
        description="Bisherige Partner von SwissHub. Werden auf der öffentlichen Seite und auf Sponsorenseiten als Referenzen dargestellt."
        meta={
          <span className="text-[12.5px] text-fg-subtle">
            {partners.filter((partner) => partner.visible).length} sichtbar · {partners.length} insgesamt
          </span>
        }
      />
      <PartnerManager partners={partners} />
    </>
  )
}
