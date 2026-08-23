import type { ReactNode } from 'react'

import { PageHeader } from '@/components/ui/PageHeader'
import { SettingsNav } from '@/components/admin/SettingsNav'

export default function SettingsLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <PageHeader
        title="Einstellungen"
        description="Branding, SEO, rechtliche Inhalte und Ihr Adminkonto."
      />
      <div className="grid gap-5 lg:grid-cols-[240px_1fr] [&>*]:min-w-0">
        <SettingsNav />
        <div className="min-w-0">{children}</div>
      </div>
    </>
  )
}
