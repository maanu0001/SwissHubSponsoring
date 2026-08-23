import type { Metadata } from 'next'
import type { ReactNode } from 'react'

import { AdminShell } from '@/components/admin/AdminShell'
import { prisma } from '@/lib/db'
import { env } from '@/lib/env'
import { mediaUrl } from '@/lib/media'
import { requireUser } from '@/lib/session'
import { getSettings } from '@/lib/settings'

export const metadata: Metadata = {
  title: { default: 'Admin', template: '%s · SwissHub Admin' },
  // The admin area is never indexed.
  robots: { index: false, follow: false, nocache: true, googleBot: { index: false, follow: false } },
}

export const dynamic = 'force-dynamic'

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const user = await requireUser('/admin')
  const settings = await getSettings()

  const logoId = settings['brand.logoMediaId']
  const logo = logoId ? await prisma.media.findUnique({ where: { id: logoId } }).catch(() => null) : null

  return (
    <AdminShell
      user={{ name: user.name, email: user.email }}
      logoUrl={mediaUrl(logo)}
      brandName={settings['brand.name'] || 'SwissHub'}
      publicUrl={env.appUrl || '/'}
    >
      {children}
    </AdminShell>
  )
}
