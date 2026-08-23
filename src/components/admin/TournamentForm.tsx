'use client'

import { useActionState, useEffect, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import type { Media, Tournament } from '@prisma/client'

import { Button } from '@/components/ui/Button'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Input, Select, Textarea, Toggle } from '@/components/ui/Field'
import { FormMessage, SubmitButton, useActionToast } from '@/components/ui/Form'
import { useToast } from '@/components/ui/Toast'
import { MediaGalleryPicker } from '@/components/admin/MediaGalleryPicker'
import { MediaPicker } from '@/components/admin/MediaPicker'
import { TOURNAMENT_STATUS, TOURNAMENT_STATUS_ORDER } from '@/lib/labels'
import { IDLE } from '@/lib/result'
import {
  createTournamentAction,
  deleteTournamentAction,
  setTournamentMediaAction,
  updateTournamentAction,
} from '@/server/actions/tournaments'

export interface TournamentFormProps {
  tournament?: Tournament & { heroImage: Media | null }
  gallery?: Media[]
  linkedPages?: number
}

function toDateInput(value: Date | null | undefined): string {
  return value ? new Date(value).toISOString().slice(0, 10) : ''
}

export function TournamentForm({ tournament, gallery = [], linkedPages = 0 }: TournamentFormProps) {
  const router = useRouter()
  const toast = useToast()
  const isEdit = Boolean(tournament)

  const [state, formAction] = useActionState(isEdit ? updateTournamentAction : createTournamentAction, IDLE)
  const [heroImageId, setHeroImageId] = useState(tournament?.heroImageId ?? '')
  const [featured, setFeatured] = useState(tournament?.featured ?? true)
  const [galleryIds, setGalleryIds] = useState(gallery.map((media) => media.id))
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  useActionToast(state)

  // A newly created tournament redirects to its edit page.
  const createdId = !isEdit && state.status === 'success' ? state.data?.id : undefined
  useEffect(() => {
    if (createdId) router.push(`/admin/tournaments/${createdId}`)
  }, [createdId, router])

  function saveGallery(ids: string[]) {
    setGalleryIds(ids)
    if (!tournament) return
    startTransition(async () => {
      const result = await setTournamentMediaAction(tournament.id, ids)
      if (result.status === 'success') toast.success(result.message ?? 'Galerie gespeichert.')
      else toast.error(result.message ?? 'Speichern fehlgeschlagen.')
    })
  }

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader
          title={isEdit ? 'Turnier bearbeiten' : 'Neues Turnier'}
          description="Diese Angaben erscheinen auf der öffentlichen Seite und in den Sponsorenseiten."
        />
        <CardBody>
          <form action={formAction} className="space-y-5">
            {tournament ? <input type="hidden" name="id" value={tournament.id} /> : null}
            <FormMessage state={state} />

            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Turniername"
                name="title"
                required
                defaultValue={tournament?.title ?? ''}
                error={state.errors?.title}
                maxLength={200}
                placeholder="z. B. SwissHub CS2 Cup 2026"
              />
              <Input
                label="Spiel"
                name="game"
                required
                defaultValue={tournament?.game ?? ''}
                error={state.errors?.game}
                maxLength={120}
                placeholder="z. B. Counter-Strike 2"
              />
            </div>

            <Input
              label="Slug"
              name="slug"
              defaultValue={tournament?.slug ?? ''}
              error={state.errors?.slug}
              maxLength={80}
              hint="Wird aus dem Namen erzeugt, wenn leer."
            />

            <Textarea
              label="Beschreibung"
              name="description"
              rows={4}
              defaultValue={tournament?.description ?? ''}
              maxLength={4000}
              placeholder="Kurze Beschreibung des Turniers für die öffentliche Darstellung."
            />

            <div className="grid gap-4 sm:grid-cols-3">
              <Select label="Status" name="status" defaultValue={tournament?.status ?? 'PLANNED'}>
                {TOURNAMENT_STATUS_ORDER.map((status) => (
                  <option key={status} value={status}>
                    {TOURNAMENT_STATUS[status].label}
                  </option>
                ))}
              </Select>
              <Input label="Startdatum" name="startDate" type="date" defaultValue={toDateInput(tournament?.startDate)} />
              <Input
                label="Enddatum"
                name="endDate"
                type="date"
                defaultValue={toDateInput(tournament?.endDate)}
                error={state.errors?.endDate}
              />
            </div>

            <Input
              label="Format"
              name="format"
              defaultValue={tournament?.format ?? ''}
              maxLength={400}
              placeholder="Online · 2 Turniertage · Gruppenphase, Halbfinale, Finale"
            />

            <div className="grid gap-4 sm:grid-cols-3">
              <Input
                label="Teilnehmende"
                name="participantCount"
                type="number"
                min={0}
                defaultValue={tournament?.participantCount ?? ''}
                hint="Tatsächliche Zahl"
              />
              <Input
                label="Erwartete Teilnehmende"
                name="expectedParticipantCount"
                type="number"
                min={0}
                defaultValue={tournament?.expectedParticipantCount ?? ''}
                hint="Für geplante Turniere"
              />
              <Input
                label="Ø Zuschauer im Stream"
                name="streamViewerCount"
                type="number"
                min={0}
                defaultValue={tournament?.streamViewerCount ?? ''}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Twitch-Link"
                name="twitchUrl"
                defaultValue={tournament?.twitchUrl ?? ''}
                error={state.errors?.twitchUrl}
                inputMode="url"
                maxLength={600}
                placeholder="https://twitch.tv/…"
              />
              <Input
                label="VOD-Link"
                name="vodUrl"
                defaultValue={tournament?.vodUrl ?? ''}
                error={state.errors?.vodUrl}
                inputMode="url"
                maxLength={600}
                placeholder="https://…"
              />
            </div>

            <MediaPicker
              label="Hero-Bild"
              name="heroImageId"
              value={heroImageId}
              initialMedia={tournament?.heroImage ?? null}
              onChange={(id) => setHeroImageId(id)}
              hint="Wird in Turnierkarten und auf der öffentlichen Seite angezeigt."
            />

            <Toggle
              name="featured"
              checked={featured}
              onChange={setFeatured}
              label="Auf der öffentlichen Seite anzeigen"
              description="Deaktivieren Sie dies, um das Turnier nur intern zu führen."
            />

            <Textarea
              label="Interne Notizen"
              name="internalNotes"
              rows={3}
              defaultValue={tournament?.internalNotes ?? ''}
              maxLength={5000}
              hint="Erscheint niemals öffentlich."
            />

            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => router.push('/admin/tournaments')}>
                Abbrechen
              </Button>
              <SubmitButton>{isEdit ? 'Änderungen speichern' : 'Turnier erstellen'}</SubmitButton>
            </div>
          </form>
        </CardBody>
      </Card>

      {tournament ? (
        <>
          <Card>
            <CardHeader
              title="Bildergalerie"
              description="Bilder aus diesem Turnier – nutzbar in Galerie-Sektionen von Sponsorenseiten."
            />
            <CardBody>
              <MediaGalleryPicker
                value={galleryIds}
                initialMedia={gallery}
                onChange={saveGallery}
                busy={isPending}
              />
            </CardBody>
          </Card>

          <Card className="border-danger/25">
            <CardHeader
              title="Turnier löschen"
              description={
                linkedPages > 0
                  ? `Dieses Turnier ist mit ${linkedPages} Sponsorenseite(n) verknüpft. Archivieren Sie es stattdessen über den Status.`
                  : 'Das Turnier wird endgültig entfernt.'
              }
            />
            <CardBody>
              <Button
                type="button"
                variant="danger"
                size="sm"
                onClick={() => setDeleteOpen(true)}
                disabled={isPending || linkedPages > 0}
              >
                Turnier löschen
              </Button>
            </CardBody>
          </Card>

          <ConfirmDialog
            open={deleteOpen}
            onClose={() => setDeleteOpen(false)}
            onConfirm={async () => {
              const result = await deleteTournamentAction(tournament.id)
              if (result.status === 'success') {
                toast.success(result.message ?? 'Gelöscht.')
                router.push('/admin/tournaments')
              } else {
                toast.error(result.message ?? 'Löschen fehlgeschlagen.')
              }
            }}
            title="Turnier löschen?"
            description={`„${tournament.title}“ wird endgültig entfernt. Dieser Schritt kann nicht rückgängig gemacht werden.`}
            confirmLabel="Turnier löschen"
          />
        </>
      ) : null}
    </div>
  )
}
