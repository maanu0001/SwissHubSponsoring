'use client'

import { useActionState } from 'react'

import { Input } from '@/components/ui/Field'
import { FormMessage, SubmitButton } from '@/components/ui/Form'
import { loginAction } from '@/server/actions/auth'
import { IDLE } from '@/lib/result'

export function LoginForm({ next }: { next?: string }) {
  const [state, formAction] = useActionState(loginAction, IDLE)

  return (
    <form action={formAction} className="space-y-4" noValidate>
      {next ? <input type="hidden" name="next" value={next} /> : null}

      <FormMessage state={state} />

      <Input
        label="E-Mail"
        name="email"
        type="email"
        autoComplete="username"
        inputMode="email"
        required
        autoFocus
        placeholder="admin@swisshub.gg"
        error={state.errors?.email}
      />

      <Input
        label="Passwort"
        name="password"
        type="password"
        autoComplete="current-password"
        required
        placeholder="••••••••••"
        error={state.errors?.password}
      />

      <SubmitButton fullWidth size="lg">
        Anmelden
      </SubmitButton>
    </form>
  )
}
