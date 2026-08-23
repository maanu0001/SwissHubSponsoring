'use client'

import { useEffect } from 'react'

import { ErrorShell } from '@/components/public/ErrorShell'

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error('[app] unhandled error', error)
  }, [error])

  return (
    <ErrorShell
      code="500"
      title="Da ist etwas schiefgelaufen"
      description="Auf dem Server ist ein unerwarteter Fehler aufgetreten. Versuchen Sie es bitte erneut – wenn das Problem bestehen bleibt, melden Sie sich bei uns."
    >
      <button
        type="button"
        onClick={reset}
        className="inline-flex h-10 items-center rounded-control border border-line-strong px-4 text-sm font-medium text-fg transition-colors hover:border-brand-accent/70 hover:bg-surface-raised"
      >
        Erneut versuchen
      </button>
      {error.digest ? (
        <p className="mt-4 font-mono text-[12px] text-fg-subtle">Referenz: {error.digest}</p>
      ) : null}
    </ErrorShell>
  )
}
