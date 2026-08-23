import type { Metadata } from 'next'

import { PageHeader } from '@/components/ui/PageHeader'
import { TournamentForm } from '@/components/admin/TournamentForm'
import { requireUser } from '@/lib/session'

export const metadata: Metadata = { title: 'Turnier erstellen' }
export const dynamic = 'force-dynamic'

export default async function NewTournamentPage() {
  await requireUser()
  return (
    <>
      <PageHeader
        title="Turnier erstellen"
        description="Legen Sie ein neues Turnier an, um es Sponsorenseiten zuordnen zu können."
        breadcrumbs={[{ label: 'Turniere', href: '/admin/tournaments' }, { label: 'Neu' }]}
      />
      <TournamentForm />
    </>
  )
}
