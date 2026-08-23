'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'

import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { CopyButton } from '@/components/ui/CopyButton'
import { Input } from '@/components/ui/Field'
import { Modal } from '@/components/ui/Modal'
import { useToast } from '@/components/ui/Toast'
import { formatDateTime } from '@/lib/format'
import { IDLE } from '@/lib/result'
import { deleteSponsorPageAction, setPagePasswordAction, setPageStatusAction } from '@/server/actions/sponsor-pages'

import type { EditorPage } from '@/app/admin/(app)/sponsor-pages/[id]/SponsorPageEditor'

export interface PublishPanelProps {
  page: EditorPage
  publicUrl: string
}

/** Publishing, password protection and deletion for a single sponsor page. */
export function PublishPanel({ page, publicUrl }: PublishPanelProps) {
  const router = useRouter()
  const toast = useToast()
  const [isPending, startTransition] = useTransition()
  const [publishOpen, setPublishOpen] = useState(false)
  const [passwordOpen, setPasswordOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)

  const isPublished = page.status === 'PUBLISHED'
  const isProtected = page.visibility === 'PASSWORD_PROTECTED'

  function changeStatus(status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED') {
    startTransition(async () => {
      const result = await setPageStatusAction(page.id, status)
      if (result.status === 'success') {
        toast.success(result.message ?? 'Aktualisiert.')
        setPublishOpen(false)
        router.refresh()
      } else {
        toast.error(result.message ?? 'Aktualisierung fehlgeschlagen.')
      }
    })
  }

  function savePassword(formData: FormData) {
    startTransition(async () => {
      const result = await setPagePasswordAction(IDLE, formData)
      if (result.status === 'success') {
        toast.success(result.message ?? 'Gespeichert.')
        setPasswordOpen(false)
        router.refresh()
      } else {
        toast.error(result.message ?? 'Speichern fehlgeschlagen.')
      }
    })
  }

  function removeProtection() {
    const formData = new FormData()
    formData.set('id', page.id)
    formData.set('enabled', 'false')
    savePassword(formData)
  }

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader
          title="Veröffentlichung"
          description={
            isPublished
              ? 'Die Seite ist über den Link erreichbar.'
              : 'Entwürfe und archivierte Seiten sind niemals öffentlich erreichbar.'
          }
        />
        <CardBody className="space-y-4">
          {isPublished ? (
            <>
              <div className="rounded-control border border-line bg-surface-raised px-3.5 py-3">
                <p className="text-[12px] uppercase tracking-wide text-fg-subtle">Öffentlicher Link</p>
                <p className="mt-1 break-all font-mono text-[12.5px] text-fg">{publicUrl}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <CopyButton value={publicUrl} size="sm" variant="primary" />
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => changeStatus('DRAFT')}
                  disabled={isPending}
                >
                  Offline nehmen
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => changeStatus('ARCHIVED')}
                  disabled={isPending}
                >
                  Archivieren
                </Button>
              </div>
              {page.publishedAt ? (
                <p className="text-[12.5px] text-fg-subtle">
                  Veröffentlicht am {formatDateTime(page.publishedAt)}
                </p>
              ) : null}
            </>
          ) : (
            <>
              <Alert tone="info">
                Diese Seite ist {page.status === 'ARCHIVED' ? 'archiviert' : 'ein Entwurf'} und für niemanden
                ausserhalb des Adminbereichs erreichbar.
              </Alert>
              <Button type="button" onClick={() => setPublishOpen(true)} disabled={isPending}>
                Seite veröffentlichen
              </Button>
            </>
          )}
        </CardBody>
      </Card>

      <Card>
        <CardHeader
          title="Sichtbarkeit"
          description={
            isProtected
              ? 'Beim Öffnen wird zuerst ein Passwort abgefragt.'
              : 'Jeder mit dem Link kann die Seite sehen.'
          }
        />
        <CardBody className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="secondary" size="sm" onClick={() => setPasswordOpen(true)}>
              {isProtected ? 'Passwort ändern' : 'Passwortschutz aktivieren'}
            </Button>
            {isProtected ? (
              <Button type="button" variant="ghost" size="sm" onClick={removeProtection} disabled={isPending}>
                Schutz deaktivieren
              </Button>
            ) : null}
          </div>
          <p className="text-[12.5px] leading-relaxed text-fg-subtle">
            Das Passwort wird sicher gehasht gespeichert und niemals an den Browser ausgeliefert.
          </p>
        </CardBody>
      </Card>

      <Card className="border-danger/25">
        <CardHeader title="Seite löschen" description="Entfernt die Seite mit allen Sektionen und Leistungen." />
        <CardBody>
          <Button type="button" variant="danger" size="sm" onClick={() => setDeleteOpen(true)} disabled={isPending}>
            Seite endgültig löschen
          </Button>
        </CardBody>
      </Card>

      <ConfirmDialog
        open={publishOpen}
        onClose={() => setPublishOpen(false)}
        onConfirm={() => changeStatus('PUBLISHED')}
        title="Seite veröffentlichen?"
        description={
          <>
            <p>
              Die Seite wird unter <span className="font-mono text-fg">{publicUrl}</span> erreichbar. Danach können Sie
              den Link kopieren und per E-Mail versenden.
            </p>
            <p className="mt-2">
              Sie können die Seite jederzeit wieder offline nehmen oder zusätzlich mit einem Passwort schützen.
            </p>
          </>
        }
        confirmLabel="Jetzt veröffentlichen"
        variant="primary"
      />

      <Modal
        open={passwordOpen}
        onClose={() => setPasswordOpen(false)}
        title={page.hasPassword ? 'Passwort ändern' : 'Passwortschutz aktivieren'}
        description="Mindestens 8 Zeichen mit Buchstaben und Zahlen."
        size="sm"
        busy={isPending}
      >
        <form action={savePassword} className="space-y-4">
          <input type="hidden" name="id" value={page.id} />
          <input type="hidden" name="enabled" value="true" />
          <Input
            label="Passwort"
            name="password"
            type="text"
            autoComplete="off"
            required={!page.hasPassword}
            placeholder={page.hasPassword ? 'Leer lassen, um das bestehende Passwort zu behalten' : 'Passwort festlegen'}
            hint="Notieren Sie das Passwort – es kann später nicht wieder ausgelesen werden."
          />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setPasswordOpen(false)}>
              Abbrechen
            </Button>
            <Button type="submit" loading={isPending}>
              Speichern
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={() => {
          startTransition(async () => {
            const result = await deleteSponsorPageAction(page.id)
            if (result.status === 'success') {
              toast.success(result.message ?? 'Gelöscht.')
              router.push('/admin/sponsor-pages')
            } else {
              toast.error(result.message ?? 'Löschen fehlgeschlagen.')
            }
          })
        }}
        title="Sponsorenseite löschen?"
        description="Alle Sektionen, Leistungen und Statistiken dieser Seite werden entfernt. Bereits versendete Links funktionieren danach nicht mehr."
        confirmLabel="Endgültig löschen"
        requireTyped={page.slug}
      />
    </div>
  )
}
