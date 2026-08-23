import type { Metadata } from 'next'

import { SettingsForm } from '@/components/admin/SettingsForm'
import { loadSettingsGroup } from '@/lib/settings-page'
import { requireUser } from '@/lib/session'

export const metadata: Metadata = { title: 'SEO & Kontakt' }
export const dynamic = 'force-dynamic'

export default async function SeoSettingsPage() {
  await requireUser()
  const seo = await loadSettingsGroup('seo')
  const contact = await loadSettingsGroup('contact')

  return (
    <div className="space-y-5">
      <SettingsForm
        group="seo"
        title="SEO & Social"
        description="Titel, Meta-Description und Vorschaubild für Suchmaschinen und geteilte Links."
        definitions={seo.definitions}
        values={seo.values}
        mediaById={seo.mediaById}
      />
      <SettingsForm
        group="contact"
        title="Kontakt & Kanäle"
        description="Kontaktadresse und Links zu den SwissHub-Kanälen im Footer."
        definitions={contact.definitions}
        values={contact.values}
        mediaById={contact.mediaById}
      />
    </div>
  )
}
