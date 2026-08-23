import type { Metadata } from 'next'

import { ErrorShell } from '@/components/public/ErrorShell'

export const metadata: Metadata = {
  title: 'Kein Zugriff',
  robots: { index: false, follow: false },
}

export default function Forbidden() {
  return (
    <ErrorShell
      code="403"
      title="Kein Zugriff"
      description="Für diesen Bereich fehlt Ihnen die Berechtigung. Melden Sie sich an oder wenden Sie sich an das SwissHub-Team."
      primaryHref="/admin/login"
      primaryLabel="Zum Login"
    />
  )
}
