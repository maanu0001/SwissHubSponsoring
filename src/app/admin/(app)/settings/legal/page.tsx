import type { Metadata } from 'next'

import { Alert } from '@/components/ui/Alert'
import { SettingsForm } from '@/components/admin/SettingsForm'
import { loadSettingsGroup } from '@/lib/settings-page'
import { requireUser } from '@/lib/session'

export const metadata: Metadata = { title: 'Rechtliches' }
export const dynamic = 'force-dynamic'

export default async function LegalSettingsPage() {
  await requireUser()
  const { definitions, values, mediaById } = await loadSettingsGroup('legal')

  return (
    <div className="space-y-5">
      <Alert tone="warning" title="Rechtliche Inhalte prüfen lassen">
        Impressum und Datenschutzerklärung sind mit Platzhaltern vorbelegt. Ersetzen Sie diese durch die
        tatsächlichen Angaben von SwissHub und lassen Sie die Texte rechtlich prüfen.
      </Alert>
      <SettingsForm
        group="legal"
        title="Rechtliche Inhalte"
        description="Diese Texte erscheinen unter /impressum und /datenschutz."
        definitions={definitions}
        values={values}
        mediaById={mediaById}
      />
    </div>
  )
}
