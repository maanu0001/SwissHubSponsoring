import type { Metadata } from 'next'
import { redirect } from 'next/navigation'

import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/session'
import { getSettings } from '@/lib/settings'
import { mediaUrl } from '@/lib/media'
import { BrandMark } from '@/components/BrandMark'

import { LoginForm } from './LoginForm'

export const metadata: Metadata = {
  title: 'Anmeldung',
  robots: { index: false, follow: false, nocache: true },
}

export const dynamic = 'force-dynamic'

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>
}) {
  const user = await getCurrentUser()
  if (user) redirect('/admin')

  const [{ next }, settings] = await Promise.all([searchParams, getSettings()])
  const logoId = settings['brand.logoMediaId']
  const logo = logoId ? await prisma.media.findUnique({ where: { id: logoId } }).catch(() => null) : null

  return (
    <main id="main" className="relative flex min-h-dvh items-center justify-center overflow-hidden px-5 py-12">
      <div className="brand-glow pointer-events-none absolute inset-0 -z-10" aria-hidden="true" />
      <div className="grid-texture pointer-events-none absolute inset-0 -z-10 opacity-30" aria-hidden="true" />

      <div className="w-full max-w-[400px]">
        <div className="mb-8 flex flex-col items-center text-center">
          <BrandMark logoUrl={mediaUrl(logo)} name={settings['brand.name'] || 'SwissHub'} size="lg" />
          <h1 className="mt-6 font-display text-xl font-semibold tracking-tight">Sponsoring-Adminbereich</h1>
          <p className="mt-1.5 text-[13.5px] text-fg-muted">Bitte melden Sie sich mit Ihrem Konto an.</p>
        </div>

        <div className="surface-card shadow-lift">
          <div className="px-6 py-6">
            <LoginForm next={next} />
          </div>
        </div>

        <p className="mt-6 text-center text-[12.5px] leading-relaxed text-fg-subtle">
          Es gibt keine öffentliche Registrierung. Zugänge werden vom SwissHub-Team eingerichtet.
        </p>
      </div>
    </main>
  )
}
