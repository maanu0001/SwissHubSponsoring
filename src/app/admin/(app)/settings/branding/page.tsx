import type { Metadata } from 'next'

import { Alert } from '@/components/ui/Alert'
import { SettingsForm } from '@/components/admin/SettingsForm'
import { loadSettingsGroup } from '@/lib/settings-page'
import { requireUser } from '@/lib/session'

export const metadata: Metadata = { title: 'Branding' }
export const dynamic = 'force-dynamic'

export default async function BrandingSettingsPage() {
  await requireUser()
  const { definitions, values, mediaById } = await loadSettingsGroup('branding')

  return (
    <div className="space-y-5">
      <Alert tone="info">
        Farben werden als CSS-Variablen ausgeliefert und wirken sofort auf den Adminbereich, die öffentliche Seite und
        alle Sponsorenseiten – ohne Neuaufbau der Anwendung.
      </Alert>
      <SettingsForm
        group="branding"
        title="Branding"
        description="Logo, Favicon und Farbschema von SwissHub."
        definitions={definitions}
        values={values}
        mediaById={mediaById}
      />
    </div>
  )
}
