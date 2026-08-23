'use client'

import { useActionState, useState } from 'react'
import type { Media } from '@prisma/client'

import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { Input, Select, Textarea, Toggle } from '@/components/ui/Field'
import { FormMessage, SubmitButton, useActionToast } from '@/components/ui/Form'
import { MediaPicker } from '@/components/admin/MediaPicker'
import { SUPPORT_TYPE, SUPPORT_TYPE_ORDER } from '@/lib/labels'
import { IDLE } from '@/lib/result'
import { updateSponsorPageAction } from '@/server/actions/sponsor-pages'

import type { EditorPage } from '@/app/admin/(app)/sponsor-pages/[id]/SponsorPageEditor'

export interface PageSettingsFormProps {
  page: EditorPage
  heroImage: Media | null
  tournaments: { id: string; title: string; game: string }[]
}

export function PageSettingsForm({ page, heroImage, tournaments }: PageSettingsFormProps) {
  const [state, formAction] = useActionState(updateSponsorPageAction, IDLE)
  const [heroImageId, setHeroImageId] = useState(page.heroImageId)
  const [noindex, setNoindex] = useState(page.noindex)
  useActionToast(state)

  return (
    <Card>
      <CardHeader title="Einstellungen" description="Titel, Link, Turnier und gewünschte Unterstützung." />
      <CardBody>
        <form action={formAction} className="space-y-5">
          <input type="hidden" name="id" value={page.id} />
          <FormMessage state={state} />

          <Input
            label="Titel"
            name="title"
            required
            defaultValue={page.title}
            error={state.errors?.title}
            maxLength={200}
          />
          <Input label="Untertitel" name="subtitle" defaultValue={page.subtitle} maxLength={300} />

          <Input
            label="Link"
            name="slug"
            prefix="/partner/"
            required
            defaultValue={page.slug}
            error={state.errors?.slug}
            maxLength={80}
            hint="Achtung: Ein geänderter Link macht bereits versendete Links ungültig."
          />

          <MediaPicker
            label="Hero-Bild"
            name="heroImageId"
            value={heroImageId}
            initialMedia={heroImage}
            onChange={(id) => setHeroImageId(id)}
            hint="Optionales Hintergrundbild im Hero-Bereich."
          />

          <Select label="Turnier" name="tournamentId" defaultValue={page.tournamentId}>
            <option value="">Kein Turnier zuordnen</option>
            {tournaments.map((tournament) => (
              <option key={tournament.id} value={tournament.id}>
                {tournament.title} · {tournament.game}
              </option>
            ))}
          </Select>

          <div className="grid gap-4 sm:grid-cols-3">
            <Select label="Art der Unterstützung" name="requestedSupportType" defaultValue={page.requestedSupportType}>
              {SUPPORT_TYPE_ORDER.map((entry) => (
                <option key={entry} value={entry}>
                  {SUPPORT_TYPE[entry].label}
                </option>
              ))}
            </Select>
            <Input
              label="Betrag"
              name="requestedAmount"
              defaultValue={page.requestedAmount === null ? '' : String(page.requestedAmount)}
              inputMode="decimal"
              placeholder="2000"
            />
            <Input label="Währung" name="currency" defaultValue={page.currency} maxLength={8} />
          </div>

          <Textarea
            label="Beschreibung der gewünschten Unterstützung"
            name="requestedSupportText"
            rows={3}
            defaultValue={page.requestedSupportText}
            maxLength={1000}
          />

          <Toggle
            name="noindex"
            checked={noindex}
            onChange={setNoindex}
            label="Von Suchmaschinen ausschliessen (noindex)"
            description="Empfohlen. Individuelle Sponsorenseiten sind für die direkte Kommunikation gedacht und sollen nicht bei Google erscheinen."
          />

          <div className="flex justify-end">
            <SubmitButton>Einstellungen speichern</SubmitButton>
          </div>
        </form>
      </CardBody>
    </Card>
  )
}
