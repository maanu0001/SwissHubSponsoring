'use client'

import { useActionState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

import { Alert } from '@/components/ui/Alert'
import { Input } from '@/components/ui/Field'
import { SubmitButton } from '@/components/ui/Form'
import { IDLE } from '@/lib/result'
import { unlockPageAction } from '@/server/actions/page-access'

export interface PasswordGateProps {
  slug: string
  title: string
  sponsorName: string
}

/** Elegant password prompt shown in front of a protected sponsor page. */
export function PasswordGate({ slug, title, sponsorName }: PasswordGateProps) {
  const [state, formAction] = useActionState(unlockPageAction, IDLE)
  const router = useRouter()

  // Reload the route once the cookie has been granted.
  useEffect(() => {
    if (state.status === 'success') router.refresh()
  }, [state.status, router])

  return (
    <main id="main" className="relative flex min-h-dvh items-center justify-center overflow-hidden px-5 py-16">
      <div className="brand-glow pointer-events-none absolute inset-0 -z-20" aria-hidden="true" />
      <div className="grid-texture pointer-events-none absolute inset-0 -z-10 opacity-40" aria-hidden="true" />

      <div className="w-full max-w-[420px]">
        <div className="mb-8 text-center">
          <span className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-brand-accent/35 bg-brand/12 text-brand-accent">
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
              <rect x="4" y="10" width="16" height="10" rx="2.5" />
              <path d="M8 10V7a4 4 0 1 1 8 0v3" />
            </svg>
          </span>
          <h1 className="mt-5 font-display text-[22px] font-semibold tracking-tight sm:text-[26px]">{title}</h1>
          <p className="mt-2.5 text-[14px] leading-relaxed text-fg-muted">
            Diese Seite wurde individuell für {sponsorName} erstellt und ist mit einem Passwort geschützt.
          </p>
        </div>

        <div className="surface-card shadow-lift">
          <form action={formAction} className="space-y-4 px-6 py-6">
            <input type="hidden" name="slug" value={slug} />

            {state.status === 'error' && state.message ? <Alert tone="danger">{state.message}</Alert> : null}

            <Input
              label="Passwort"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              autoFocus
              placeholder="Passwort eingeben"
            />

            <SubmitButton fullWidth size="lg">
              Seite öffnen
            </SubmitButton>
          </form>
        </div>

        <p className="mt-6 text-center text-[12.5px] leading-relaxed text-fg-subtle">
          Sie haben kein Passwort erhalten? Antworten Sie einfach direkt auf die E-Mail, über die Sie diesen Link
          bekommen haben.
        </p>
      </div>
    </main>
  )
}
