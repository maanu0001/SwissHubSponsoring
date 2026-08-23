import type { Metadata } from 'next'

import { ErrorShell } from '@/components/public/ErrorShell'

export const metadata: Metadata = {
  title: 'Seite nicht gefunden',
  robots: { index: false, follow: false },
}

export default function NotFound() {
  return (
    <ErrorShell
      code="404"
      title="Diese Seite gibt es nicht"
      description="Der aufgerufene Link existiert nicht oder wurde verschoben. Prüfen Sie die Adresse oder kehren Sie zur Startseite zurück."
    />
  )
}
