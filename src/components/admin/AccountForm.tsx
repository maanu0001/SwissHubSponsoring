'use client'

import { useActionState, useState, useTransition } from 'react'

import { Button } from '@/components/ui/Button'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Input } from '@/components/ui/Field'
import { FormMessage, SubmitButton, useActionToast } from '@/components/ui/Form'
import { useToast } from '@/components/ui/Toast'
import { IDLE } from '@/lib/result'
import { changePasswordAction, revokeOtherSessionsAction, updateAccountAction } from '@/server/actions/settings'

export function AccountForm({
  name,
  email,
  sessionCount,
}: {
  name: string
  email: string
  sessionCount: number
}) {
  const [accountState, accountAction] = useActionState(updateAccountAction, IDLE)
  const [passwordState, passwordAction] = useActionState(changePasswordAction, IDLE)
  const [revokeOpen, setRevokeOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const toast = useToast()
  useActionToast(accountState)
  useActionToast(passwordState)

  return (
    <>
      <Card>
        <CardHeader title="Kontodaten" description="Name und E-Mail-Adresse für die Anmeldung." />
        <CardBody>
          <form action={accountAction} className="space-y-4">
            <FormMessage state={accountState} />
            <Input label="Name" name="name" required defaultValue={name} error={accountState.errors?.name} maxLength={120} />
            <Input
              label="E-Mail"
              name="email"
              type="email"
              required
              defaultValue={email}
              error={accountState.errors?.email}
              maxLength={200}
            />
            <div className="flex justify-end">
              <SubmitButton>Speichern</SubmitButton>
            </div>
          </form>
        </CardBody>
      </Card>

      <Card>
        <CardHeader
          title="Passwort ändern"
          description="Mindestens 10 Zeichen mit Buchstaben und Zahlen."
        />
        <CardBody>
          <form action={passwordAction} className="space-y-4">
            <FormMessage state={passwordState} />
            <Input
              label="Aktuelles Passwort"
              name="currentPassword"
              type="password"
              autoComplete="current-password"
              required
              error={passwordState.errors?.currentPassword}
            />
            <Input
              label="Neues Passwort"
              name="newPassword"
              type="password"
              autoComplete="new-password"
              required
              error={passwordState.errors?.newPassword}
            />
            <Input
              label="Neues Passwort bestätigen"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              required
              error={passwordState.errors?.confirmPassword}
            />
            <div className="flex justify-end">
              <SubmitButton>Passwort ändern</SubmitButton>
            </div>
          </form>
        </CardBody>
      </Card>

      <Card>
        <CardHeader
          title="Sitzungen"
          description={`Aktuell ${sessionCount} aktive Sitzung${sessionCount === 1 ? '' : 'en'}. Beenden Sie alle anderen, wenn Sie sich auf einem fremden Gerät angemeldet haben.`}
        />
        <CardBody>
          <Button type="button" variant="secondary" onClick={() => setRevokeOpen(true)} disabled={isPending}>
            Alle anderen Sitzungen beenden
          </Button>
        </CardBody>
      </Card>

      <ConfirmDialog
        open={revokeOpen}
        onClose={() => setRevokeOpen(false)}
        onConfirm={() =>
          new Promise<void>((resolve) => {
            startTransition(async () => {
              const result = await revokeOtherSessionsAction()
              if (result.status === 'success') toast.success(result.message ?? 'Erledigt.')
              else toast.error(result.message ?? 'Fehlgeschlagen.')
              resolve()
            })
          })
        }
        title="Alle anderen Sitzungen beenden?"
        description="Sie bleiben in diesem Browser angemeldet. Alle anderen Geräte müssen sich neu anmelden."
        confirmLabel="Sitzungen beenden"
        variant="secondary"
      />
    </>
  )
}
