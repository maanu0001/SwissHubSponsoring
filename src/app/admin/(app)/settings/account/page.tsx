import type { Metadata } from 'next'

import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { AccountForm } from '@/components/admin/AccountForm'
import { prisma } from '@/lib/db'
import { formatDateTime } from '@/lib/format'
import { requireUser } from '@/lib/session'

export const metadata: Metadata = { title: 'Konto' }
export const dynamic = 'force-dynamic'

export default async function AccountSettingsPage() {
  const user = await requireUser()

  const [record, sessionCount] = await Promise.all([
    prisma.adminUser.findUnique({
      where: { id: user.id },
      select: { name: true, email: true, lastLogin: true, createdAt: true },
    }),
    prisma.session.count({ where: { userId: user.id, expiresAt: { gt: new Date() } } }),
  ])

  return (
    <div className="space-y-5">
      <AccountForm name={record?.name ?? user.name} email={record?.email ?? user.email} sessionCount={sessionCount} />

      <Card>
        <CardHeader title="Kontoinformationen" />
        <CardBody>
          <dl className="grid gap-2.5 text-[13px] sm:grid-cols-2">
            <Row label="Konto erstellt" value={formatDateTime(record?.createdAt)} />
            <Row label="Letzte Anmeldung" value={formatDateTime(record?.lastLogin)} />
            <Row label="Aktive Sitzungen" value={String(sessionCount)} />
          </dl>
          <p className="mt-4 border-t border-line pt-4 text-[12.5px] leading-relaxed text-fg-subtle">
            Weitere Adminkonten werden auf dem Server per CLI angelegt:{' '}
            <code className="rounded bg-surface-raised px-1.5 py-0.5 font-mono text-[12px] text-fg-muted">
              npm run admin:create -- --email name@swisshub.gg --name &quot;Name&quot;
            </code>
          </p>
        </CardBody>
      </Card>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3 rounded-control border border-line bg-surface-raised px-3.5 py-2.5">
      <dt className="text-fg-subtle">{label}</dt>
      <dd className="text-fg-muted">{value}</dd>
    </div>
  )
}
