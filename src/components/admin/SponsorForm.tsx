'use client'

import { useActionState, useState } from 'react'
import type { Media, Sponsor } from '@prisma/client'

import { Button } from '@/components/ui/Button'
import { Input, Select, Textarea } from '@/components/ui/Field'
import { FormMessage, SubmitButton, useActionToast } from '@/components/ui/Form'
import { MediaPicker } from '@/components/admin/MediaPicker'
import { SPONSOR_STATUS, SPONSOR_STATUS_ORDER } from '@/lib/labels'
import { IDLE } from '@/lib/result'
import { markContactedAction, updateSponsorAction } from '@/server/actions/sponsors'
import { useToast } from '@/components/ui/Toast'

export function SponsorForm({ sponsor, logo }: { sponsor: Sponsor; logo: Media | null }) {
  const [state, formAction] = useActionState(updateSponsorAction, IDLE)
  const [logoId, setLogoId] = useState(sponsor.logoId ?? '')
  const [busy, setBusy] = useState(false)
  const toast = useToast()
  useActionToast(state)

  async function markContacted() {
    setBusy(true)
    const result = await markContactedAction(sponsor.id)
    setBusy(false)
    if (result.status === 'success') toast.success(result.message ?? 'Aktualisiert.')
    else toast.error(result.message ?? 'Fehlgeschlagen.')
  }

  const lastContact = sponsor.lastContactDate
    ? new Date(sponsor.lastContactDate).toISOString().slice(0, 10)
    : ''

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="id" value={sponsor.id} />
      <FormMessage state={state} />

      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Firmenname"
          name="companyName"
          required
          defaultValue={sponsor.companyName}
          error={state.errors?.companyName}
          maxLength={160}
        />
        <Input
          label="Slug"
          name="slug"
          defaultValue={sponsor.slug}
          error={state.errors?.slug}
          hint="Interner Kurzname, wird als Vorschlag für neue Seiten verwendet."
          maxLength={80}
        />
      </div>

      <MediaPicker
        label="Logo"
        name="logoId"
        value={logoId}
        initialMedia={logo}
        onChange={(id) => setLogoId(id)}
        hint="Wird auf der Sponsorenseite im Hero-Bereich angezeigt."
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <Input label="Website" name="website" defaultValue={sponsor.website ?? ''} inputMode="url" maxLength={400} />
        <Input label="Branche" name="industry" defaultValue={sponsor.industry ?? ''} maxLength={120} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Input label="Ansprechpartner" name="contactName" defaultValue={sponsor.contactName ?? ''} maxLength={160} />
        <Input
          label="E-Mail"
          name="contactEmail"
          type="email"
          inputMode="email"
          defaultValue={sponsor.contactEmail ?? ''}
          error={state.errors?.contactEmail}
          maxLength={200}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Input label="Telefonnummer" name="contactPhone" type="tel" defaultValue={sponsor.contactPhone ?? ''} maxLength={60} />
        <div className="space-y-1.5">
          <Input label="Letztes Kontaktdatum" name="lastContactDate" type="date" defaultValue={lastContact} />
          <Button type="button" variant="ghost" size="sm" onClick={markContacted} loading={busy}>
            Heute als kontaktiert markieren
          </Button>
        </div>
      </div>

      <Select label="Status" name="status" defaultValue={sponsor.status}>
        {SPONSOR_STATUS_ORDER.map((status) => (
          <option key={status} value={status}>
            {SPONSOR_STATUS[status].label}
          </option>
        ))}
      </Select>

      <Textarea
        label="Interne Notizen"
        name="internalNotes"
        rows={4}
        defaultValue={sponsor.internalNotes ?? ''}
        maxLength={5000}
        hint="Erscheint niemals auf der öffentlichen Sponsorenseite."
      />

      <div className="flex justify-end">
        <SubmitButton>Änderungen speichern</SubmitButton>
      </div>
    </form>
  )
}
