'use client'

import type { Media, SectionType } from '@prisma/client'

import { Input, Select, Textarea, Toggle } from '@/components/ui/Field'
import { MediaPicker } from '@/components/admin/MediaPicker'
import { SECTION_CAPABILITIES, type SectionData } from '@/lib/section-data'

import { Repeater } from './Repeater'

export interface SectionDataEditorProps {
  type: SectionType
  data: SectionData
  onChange: (data: SectionData) => void
  /** Available for the tournament and partner pickers. */
  tournaments: { id: string; title: string; game: string }[]
  partners: { id: string; name: string }[]
  mediaById: Record<string, Media>
}

/**
 * Renders exactly the structured editors a section kind supports.
 * Everything writes back into the section's `data` payload.
 */
export function SectionDataEditor({
  type,
  data,
  onChange,
  tournaments,
  partners,
  mediaById,
}: SectionDataEditorProps) {
  const capabilities = SECTION_CAPABILITIES[type] ?? {}

  function patch(next: Partial<SectionData>) {
    onChange({ ...data, ...next })
  }

  return (
    <div className="space-y-5">
      <Input
        label="Eyebrow (kleine Zeile über dem Titel)"
        value={data.eyebrow ?? ''}
        onChange={(event) => patch({ eyebrow: event.target.value })}
        maxLength={120}
        placeholder="optional"
      />

      {capabilities.hero ? (
        <div className="space-y-3 rounded-control border border-line bg-surface-raised px-3.5 py-3.5">
          <p className="text-[13px] font-medium text-fg-muted">Hero-Optionen</p>
          <Toggle
            checked={data.hero?.showSwissHubLogo !== false}
            onChange={(checked) => patch({ hero: { ...data.hero, showSwissHubLogo: checked } })}
            label="SwissHub-Logo anzeigen"
          />
          <Toggle
            checked={data.hero?.showSponsorLogo !== false}
            onChange={(checked) => patch({ hero: { ...data.hero, showSponsorLogo: checked } })}
            label="Sponsorlogo anzeigen"
            description="Nur relevant auf individuellen Sponsorenseiten."
          />
          <Input
            label="Badges (mit Komma getrennt)"
            value={(data.hero?.badges ?? []).join(', ')}
            onChange={(event) =>
              patch({
                hero: {
                  ...data.hero,
                  badges: event.target.value
                    .split(',')
                    .map((entry) => entry.trim())
                    .filter(Boolean)
                    .slice(0, 8),
                },
              })
            }
            placeholder="z. B. Naming Rights, Presented by"
          />
        </div>
      ) : null}

      {capabilities.stats ? (
        <Repeater
          label="Kennzahlen"
          hint="Die Zahl wird beim Scrollen hochgezählt. Zeichen wie „~“ oder „+“ gehören in Präfix bzw. Suffix."
          items={data.stats ?? []}
          onChange={(stats) => patch({ stats })}
          create={() => ({ value: '', label: '', hint: '', numeric: null, prefix: '', suffix: '' })}
          summary={(item) => [item.value, item.label].filter(Boolean).join(' · ')}
          addLabel="Kennzahl hinzufügen"
          renderFields={(item, update) => (
            <>
              <div className="grid gap-3 sm:grid-cols-[80px_1fr_80px]">
                <Input label="Präfix" value={item.prefix} onChange={(e) => update({ prefix: e.target.value })} maxLength={8} />
                <Input label="Wert" value={item.value} onChange={(e) => update({ value: e.target.value })} maxLength={40} />
                <Input label="Suffix" value={item.suffix} onChange={(e) => update({ suffix: e.target.value })} maxLength={8} />
              </div>
              <Input label="Bezeichnung" value={item.label} onChange={(e) => update({ label: e.target.value })} maxLength={120} />
              <Input label="Zusatz" value={item.hint} onChange={(e) => update({ hint: e.target.value })} maxLength={200} />
            </>
          )}
        />
      ) : null}

      {capabilities.bullets ? (
        <Repeater
          label="Punkte"
          items={data.bullets ?? []}
          onChange={(bullets) => patch({ bullets })}
          create={() => ({ title: '', description: '', icon: '' })}
          summary={(item) => item.title}
          addLabel="Punkt hinzufügen"
          renderFields={(item, update) => (
            <>
              <Input label="Titel" value={item.title} onChange={(e) => update({ title: e.target.value })} maxLength={160} />
              <Textarea
                label="Beschreibung"
                value={item.description}
                onChange={(e) => update({ description: e.target.value })}
                rows={2}
                maxLength={600}
              />
            </>
          )}
        />
      ) : null}

      {capabilities.budget ? (
        <Repeater
          label="Budgetposten"
          hint="Der Anteil in Prozent ist optional und wird nur angezeigt, wenn er gesetzt ist."
          items={data.budget ?? []}
          onChange={(budget) => patch({ budget })}
          create={() => ({ title: '', description: '', share: null })}
          summary={(item) => item.title}
          addLabel="Posten hinzufügen"
          renderFields={(item, update) => (
            <>
              <div className="grid gap-3 sm:grid-cols-[1fr_110px]">
                <Input label="Titel" value={item.title} onChange={(e) => update({ title: e.target.value })} maxLength={160} />
                <Input
                  label="Anteil %"
                  type="number"
                  min={0}
                  max={100}
                  value={item.share ?? ''}
                  onChange={(e) => update({ share: e.target.value === '' ? null : Number(e.target.value) })}
                />
              </div>
              <Textarea
                label="Beschreibung"
                value={item.description}
                onChange={(e) => update({ description: e.target.value })}
                rows={2}
                maxLength={600}
              />
            </>
          )}
        />
      ) : null}

      {capabilities.steps ? (
        <Repeater
          label="Schritte"
          items={data.steps ?? []}
          onChange={(steps) => patch({ steps })}
          create={() => ({ label: '', title: '', description: '' })}
          summary={(item) => [item.label, item.title].filter(Boolean).join(' · ')}
          addLabel="Schritt hinzufügen"
          max={12}
          renderFields={(item, update) => (
            <>
              <div className="grid gap-3 sm:grid-cols-[120px_1fr]">
                <Input label="Label" value={item.label} onChange={(e) => update({ label: e.target.value })} maxLength={60} placeholder="Tag 1" />
                <Input label="Titel" value={item.title} onChange={(e) => update({ title: e.target.value })} maxLength={160} />
              </div>
              <Textarea
                label="Beschreibung"
                value={item.description}
                onChange={(e) => update({ description: e.target.value })}
                rows={2}
                maxLength={600}
              />
            </>
          )}
        />
      ) : null}

      {capabilities.quotes ? (
        <Repeater
          label="Zitate"
          items={data.quotes ?? []}
          onChange={(quotes) => patch({ quotes })}
          create={() => ({ quote: '', author: '', role: '' })}
          summary={(item) => item.author || item.quote.slice(0, 40)}
          addLabel="Zitat hinzufügen"
          max={12}
          renderFields={(item, update) => (
            <>
              <Textarea label="Zitat" value={item.quote} onChange={(e) => update({ quote: e.target.value })} rows={3} maxLength={1000} />
              <div className="grid gap-3 sm:grid-cols-2">
                <Input label="Autor" value={item.author} onChange={(e) => update({ author: e.target.value })} maxLength={120} />
                <Input label="Rolle" value={item.role} onChange={(e) => update({ role: e.target.value })} maxLength={160} />
              </div>
            </>
          )}
        />
      ) : null}

      {capabilities.links ? (
        <Repeater
          label="Links (Twitch / VOD)"
          hint="Der erste einbettbare Link wird als Player angezeigt."
          items={data.links ?? []}
          onChange={(links) => patch({ links })}
          create={() => ({ label: '', url: '', description: '' })}
          summary={(item) => item.label || item.url}
          addLabel="Link hinzufügen"
          max={12}
          renderFields={(item, update) => (
            <>
              <Input label="Bezeichnung" value={item.label} onChange={(e) => update({ label: e.target.value })} maxLength={120} />
              <Input label="URL" value={item.url} onChange={(e) => update({ url: e.target.value })} maxLength={600} inputMode="url" />
              <Input label="Zusatz" value={item.description} onChange={(e) => update({ description: e.target.value })} maxLength={400} />
            </>
          )}
        />
      ) : null}

      {capabilities.gallery ? (
        <Repeater
          label="Bilder"
          items={data.gallery ?? []}
          onChange={(gallery) => patch({ gallery })}
          create={() => ({ mediaId: '', caption: '' })}
          summary={(item) => mediaById[item.mediaId]?.title ?? 'Bild auswählen'}
          addLabel="Bild hinzufügen"
          max={30}
          renderFields={(item, update) => (
            <>
              <MediaPicker
                label="Bild"
                value={item.mediaId}
                initialMedia={mediaById[item.mediaId] ?? null}
                onChange={(id) => update({ mediaId: id })}
              />
              <Input label="Bildunterschrift" value={item.caption} onChange={(e) => update({ caption: e.target.value })} maxLength={240} />
            </>
          )}
        />
      ) : null}

      {capabilities.tournamentPicker ? (
        <div className="space-y-2">
          <p className="text-[13px] font-medium text-fg-muted">Turniere</p>
          <p className="text-[12px] leading-relaxed text-fg-subtle">
            Keine Auswahl bedeutet: alle sichtbaren Turniere werden angezeigt.
          </p>
          <div className="grid gap-1.5 sm:grid-cols-2">
            {tournaments.map((tournament) => {
              const selected = (data.tournamentIds ?? []).includes(tournament.id)
              return (
                <label
                  key={tournament.id}
                  className="flex cursor-pointer items-start gap-2.5 rounded-control border border-line bg-surface-raised px-3 py-2.5 text-[13px]"
                >
                  <input
                    type="checkbox"
                    checked={selected}
                    onChange={() => {
                      const current = data.tournamentIds ?? []
                      patch({
                        tournamentIds: selected
                          ? current.filter((id) => id !== tournament.id)
                          : [...current, tournament.id],
                      })
                    }}
                    className="mt-0.5 h-4 w-4 shrink-0 rounded border-line-strong bg-surface accent-[rgb(var(--c-brand))]"
                  />
                  <span className="min-w-0">
                    <span className="block truncate text-fg">{tournament.title}</span>
                    <span className="block truncate text-[12px] text-fg-subtle">{tournament.game}</span>
                  </span>
                </label>
              )
            })}
          </div>
        </div>
      ) : null}

      {capabilities.partnerPicker ? (
        <div className="space-y-2">
          <p className="text-[13px] font-medium text-fg-muted">Partner</p>
          <p className="text-[12px] leading-relaxed text-fg-subtle">
            Keine Auswahl bedeutet: alle sichtbaren Partner werden angezeigt.
          </p>
          <div className="grid gap-1.5 sm:grid-cols-2">
            {partners.map((partner) => {
              const selected = (data.partnerIds ?? []).includes(partner.id)
              return (
                <label
                  key={partner.id}
                  className="flex cursor-pointer items-center gap-2.5 rounded-control border border-line bg-surface-raised px-3 py-2.5 text-[13px] text-fg"
                >
                  <input
                    type="checkbox"
                    checked={selected}
                    onChange={() => {
                      const current = data.partnerIds ?? []
                      patch({
                        partnerIds: selected
                          ? current.filter((id) => id !== partner.id)
                          : [...current, partner.id],
                      })
                    }}
                    className="h-4 w-4 shrink-0 rounded border-line-strong bg-surface accent-[rgb(var(--c-brand))]"
                  />
                  <span className="truncate">{partner.name}</span>
                </label>
              )
            })}
          </div>
        </div>
      ) : null}

      {capabilities.amount ? (
        <Toggle
          checked={data.showAmount !== false}
          onChange={(checked) => patch({ showAmount: checked })}
          label="Betrag hervorgehoben anzeigen"
          description="Zeigt den gewünschten Betrag als eigene Karte neben dem Text."
        />
      ) : null}

      {capabilities.cta ? (
        <div className="space-y-3 rounded-control border border-line bg-surface-raised px-3.5 py-3.5">
          <p className="text-[13px] font-medium text-fg-muted">Call to Action</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <Input
              label="Primärer Button"
              value={data.cta?.primaryLabel ?? ''}
              onChange={(event) => patch({ cta: { ...data.cta, primaryLabel: event.target.value } })}
              maxLength={80}
            />
            <Input
              label="Ziel"
              value={data.cta?.primaryHref ?? ''}
              onChange={(event) => patch({ cta: { ...data.cta, primaryHref: event.target.value } })}
              maxLength={600}
              placeholder="#abschnitt oder https://…"
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Input
              label="Sekundärer Button"
              value={data.cta?.secondaryLabel ?? ''}
              onChange={(event) => patch({ cta: { ...data.cta, secondaryLabel: event.target.value } })}
              maxLength={80}
            />
            <Input
              label="Ziel"
              value={data.cta?.secondaryHref ?? ''}
              onChange={(event) => patch({ cta: { ...data.cta, secondaryHref: event.target.value } })}
              maxLength={600}
            />
          </div>
        </div>
      ) : null}

      {capabilities.contact ? (
        <div className="space-y-3 rounded-control border border-line bg-surface-raised px-3.5 py-3.5">
          <p className="text-[13px] font-medium text-fg-muted">Kontakt</p>
          <Input
            label="E-Mail-Adresse"
            value={data.contactEmail ?? ''}
            onChange={(event) => patch({ contactEmail: event.target.value })}
            maxLength={200}
            placeholder="Leer lassen für die Standardadresse aus den Einstellungen"
          />
          <Textarea
            label="Hinweis unter dem Kontakt"
            value={data.contactNote ?? ''}
            onChange={(event) => patch({ contactNote: event.target.value })}
            rows={2}
            maxLength={600}
          />
        </div>
      ) : null}

      {(data.stats?.length ?? 0) > 0 ? (
        <Select
          label="Spalten für Kennzahlen"
          value={String(data.columns ?? 3)}
          onChange={(event) => patch({ columns: Number(event.target.value) })}
          wrapperClassName="max-w-[200px]"
        >
          <option value="2">2 Spalten</option>
          <option value="3">3 Spalten</option>
          <option value="4">4 Spalten</option>
        </Select>
      ) : null}
    </div>
  )
}
