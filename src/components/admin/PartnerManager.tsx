'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import type { Media, PartnerReference } from '@prisma/client'

import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { EmptyState } from '@/components/ui/EmptyState'
import { Input, Textarea, Toggle } from '@/components/ui/Field'
import { Modal } from '@/components/ui/Modal'
import { SortHandle, SortableList } from '@/components/ui/SortableList'
import { useToast } from '@/components/ui/Toast'
import { MediaPicker } from '@/components/admin/MediaPicker'
import { MediaThumb } from '@/components/admin/MediaThumb'
import { cn } from '@/lib/cn'
import { displayUrl } from '@/lib/media'
import { IDLE } from '@/lib/result'
import { idSignature, useServerState } from '@/lib/use-server-state'
import {
  createPartnerAction,
  deletePartnerAction,
  reorderPartnersAction,
  updatePartnerAction,
} from '@/server/actions/site'

type PartnerWithLogo = PartnerReference & { logo: Media | null }

export function PartnerManager({ partners: initial }: { partners: PartnerWithLogo[] }) {
  const router = useRouter()
  const toast = useToast()
  // Re-syncs after router.refresh() so newly created partners appear at once.
  const [partners, setPartners] = useServerState(initial, idSignature)
  const [editing, setEditing] = useState<PartnerWithLogo | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [deleting, setDeleting] = useState<PartnerWithLogo | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleReorder(next: PartnerWithLogo[]) {
    const previous = partners
    setPartners(next)
    startTransition(async () => {
      const result = await reorderPartnersAction(next.map((partner) => partner.id))
      if (result.status === 'error') {
        setPartners(previous)
        toast.error(result.message ?? 'Die Reihenfolge konnte nicht gespeichert werden.')
      } else {
        router.refresh()
      }
    })
  }

  function submit(formData: FormData, mode: 'create' | 'update') {
    startTransition(async () => {
      const result =
        mode === 'create' ? await createPartnerAction(IDLE, formData) : await updatePartnerAction(IDLE, formData)
      if (result.status === 'success') {
        toast.success(result.message ?? 'Gespeichert.')
        setCreateOpen(false)
        setEditing(null)
        router.refresh()
      } else {
        toast.error(result.message ?? 'Speichern fehlgeschlagen.')
      }
    })
  }

  return (
    <>
      <Card>
        <CardHeader
          title="Partner"
          description="Reihenfolge per Drag-and-Drop. Logos werden per Upload oder URL hinterlegt – niemals automatisch geladen."
          actions={
            <Button type="button" size="sm" onClick={() => setCreateOpen(true)}>
              Partner hinzufügen
            </Button>
          }
        />
        <CardBody>
          {partners.length === 0 ? (
            <EmptyState
              compact
              title="Noch keine Partner erfasst"
              description="Fügen Sie bisherige Partner hinzu, um sie als Referenzen darzustellen."
              action={
                <Button type="button" size="sm" onClick={() => setCreateOpen(true)}>
                  Partner hinzufügen
                </Button>
              }
            />
          ) : (
            <SortableList
              items={partners}
              onReorder={handleReorder}
              renderItem={(partner, controls) => (
                <div
                  className={cn(
                    'flex items-start gap-2 rounded-control border border-line bg-surface-raised px-2 py-2',
                    !partner.visible && 'opacity-60',
                  )}
                >
                  <SortHandle controls={controls} className="mt-1" />
                  <MediaThumb media={partner.logo} className="h-12 w-20 shrink-0" fallback="Kein Logo" />
                  <div className="min-w-0 flex-1 py-0.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-[13.5px] font-medium text-fg">{partner.name}</p>
                      {!partner.visible ? <Badge tone="warning">Ausgeblendet</Badge> : null}
                    </div>
                    {partner.description ? (
                      <p className="mt-0.5 text-[12.5px] leading-relaxed text-fg-subtle">{partner.description}</p>
                    ) : null}
                    {partner.website ? (
                      <a
                        href={partner.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-0.5 inline-block text-[12px] text-brand-accent hover:underline"
                      >
                        {displayUrl(partner.website)}
                      </a>
                    ) : null}
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <Button type="button" variant="ghost" size="sm" onClick={() => setEditing(partner)}>
                      Bearbeiten
                    </Button>
                    <button
                      type="button"
                      onClick={() => setDeleting(partner)}
                      aria-label="Partner löschen"
                      className="rounded p-1.5 text-fg-subtle transition-colors hover:bg-danger/12 hover:text-danger"
                    >
                      <svg className="h-4 w-4" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
                        <path d="M4 6h12M8 6V4.5A1.5 1.5 0 0 1 9.5 3h1A1.5 1.5 0 0 1 12 4.5V6m1.5 0-.5 9.5A1.5 1.5 0 0 1 11.5 17h-3A1.5 1.5 0 0 1 7 15.5L6.5 6" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </button>
                  </div>
                </div>
              )}
            />
          )}
        </CardBody>
      </Card>

      <PartnerDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSubmit={(formData) => submit(formData, 'create')}
        busy={isPending}
        title="Partner hinzufügen"
      />

      <PartnerDialog
        open={Boolean(editing)}
        onClose={() => setEditing(null)}
        onSubmit={(formData) => submit(formData, 'update')}
        busy={isPending}
        partner={editing}
        title="Partner bearbeiten"
      />

      <ConfirmDialog
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        onConfirm={async () => {
          if (!deleting) return
          const result = await deletePartnerAction(deleting.id)
          if (result.status === 'success') {
            toast.success(result.message ?? 'Gelöscht.')
            setPartners((current) => current.filter((entry) => entry.id !== deleting.id))
            router.refresh()
          } else {
            toast.error(result.message ?? 'Löschen fehlgeschlagen.')
          }
        }}
        title="Partner löschen?"
        description={`„${deleting?.name}“ wird aus allen Referenzlisten entfernt. Das hinterlegte Logo bleibt in der Medienbibliothek erhalten.`}
        confirmLabel="Löschen"
      />
    </>
  )
}

function PartnerDialog({
  open,
  onClose,
  onSubmit,
  busy,
  partner,
  title,
}: {
  open: boolean
  onClose: () => void
  onSubmit: (formData: FormData) => void
  busy: boolean
  partner?: PartnerWithLogo | null
  title: string
}) {
  const [logoId, setLogoId] = useState(partner?.logoId ?? '')
  const [visible, setVisible] = useState(partner?.visible ?? true)

  return (
    <Modal open={open} onClose={onClose} title={title} size="md" busy={busy}>
      <form action={onSubmit} className="space-y-4" key={partner?.id ?? 'new'}>
        {partner ? <input type="hidden" name="id" value={partner.id} /> : null}

        <Input label="Name" name="name" required defaultValue={partner?.name ?? ''} maxLength={160} />
        <MediaPicker
          label="Logo"
          name="logoId"
          value={logoId}
          initialMedia={partner?.logo ?? null}
          onChange={(id) => setLogoId(id)}
          hint="Ohne Logo wird der Name typografisch dargestellt."
        />
        <Input
          label="Website"
          name="website"
          defaultValue={partner?.website ?? ''}
          inputMode="url"
          maxLength={400}
          placeholder="hosttech.ch"
        />
        <Textarea
          label="Beschreibung"
          name="description"
          rows={3}
          defaultValue={partner?.description ?? ''}
          maxLength={1000}
        />
        <Toggle
          name="visible"
          checked={visible}
          onChange={setVisible}
          label="Öffentlich anzeigen"
          description="Ausgeblendete Partner erscheinen weder auf der Hauptseite noch auf Sponsorenseiten."
        />

        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="ghost" onClick={onClose}>
            Abbrechen
          </Button>
          <Button type="submit" loading={busy}>
            Speichern
          </Button>
        </div>
      </form>
    </Modal>
  )
}
