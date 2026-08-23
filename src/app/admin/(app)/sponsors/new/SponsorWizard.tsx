'use client'

import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import type { Media, PageTemplate, SponsoringBenefit, Tournament } from '@prisma/client'

import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { Input, Select, Textarea } from '@/components/ui/Field'
import { Modal } from '@/components/ui/Modal'
import { useToast } from '@/components/ui/Toast'
import { BenefitSelector } from '@/components/admin/BenefitSelector'
import { MediaPicker } from '@/components/admin/MediaPicker'
import { TemplateSelector } from '@/components/admin/TemplateSelector'
import { WizardShell, type WizardStep } from '@/components/admin/WizardShell'
import { SPONSOR_STATUS, SPONSOR_STATUS_ORDER, SUPPORT_TYPE, SUPPORT_TYPE_ORDER, TOURNAMENT_STATUS } from '@/lib/labels'
import { IDLE } from '@/lib/result'
import { slugify } from '@/lib/slug'
import { quickCreateTournamentAction } from '@/server/actions/tournaments'
import { createSponsorWithPageAction } from '@/server/actions/wizard'

const STEPS: WizardStep[] = [
  { id: 1, title: 'Unternehmen', description: 'Firmenname, Logo, Website und Branche des potenziellen Partners.' },
  { id: 2, title: 'Kontakt', description: 'Ansprechpartner und interne Notizen zum Unternehmen.' },
  { id: 3, title: 'Turnier', description: 'Ordnen Sie ein bestehendes Turnier zu oder legen Sie ein neues an.' },
  { id: 4, title: 'Sponsoring', description: 'Welche Unterstützung möchten Sie konkret anfragen?' },
  { id: 5, title: 'Leistungen', description: 'Wählen Sie die Leistungen, die der Sponsor im Gegenzug erhält.' },
  { id: 6, title: 'Template', description: 'Der Ausgangspunkt der Sponsorenseite – danach ist alles frei editierbar.' },
]

export interface SponsorWizardProps {
  benefits: SponsoringBenefit[]
  templates: (PageTemplate & { _count: { defaultBenefits: number } })[]
  tournaments: Tournament[]
  defaultsByTemplate: Record<string, string[]>
  knownIndustries: string[]
}

export function SponsorWizard({
  benefits: initialBenefits,
  templates,
  tournaments: initialTournaments,
  defaultsByTemplate,
  knownIndustries,
}: SponsorWizardProps) {
  const router = useRouter()
  const toast = useToast()
  const [isPending, startTransition] = useTransition()

  const [step, setStep] = useState(1)
  const [maxReached, setMaxReached] = useState(1)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState<string | null>(null)

  const [benefits, setBenefits] = useState(initialBenefits)
  const [tournaments, setTournaments] = useState(initialTournaments)
  const [tournamentDialog, setTournamentDialog] = useState(false)

  // Step 1
  const [companyName, setCompanyName] = useState('')
  const [logoId, setLogoId] = useState('')
  const [logoMedia, setLogoMedia] = useState<Media | null>(null)
  const [website, setWebsite] = useState('')
  const [industry, setIndustry] = useState('')

  // Step 2
  const [contactName, setContactName] = useState('')
  const [contactEmail, setContactEmail] = useState('')
  const [contactPhone, setContactPhone] = useState('')
  const [internalNotes, setInternalNotes] = useState('')
  const [status, setStatus] = useState<string>('NOT_CONTACTED')

  // Step 3
  const [tournamentId, setTournamentId] = useState('')

  // Step 4
  const [supportType, setSupportType] = useState<string>('MONEY')
  const [amount, setAmount] = useState('')
  const [supportText, setSupportText] = useState('')
  const [currency, setCurrency] = useState('CHF')

  // Step 6 – declared before step 5 state because the benefit preselection
  // depends on the initially selected template.
  const [templateId, setTemplateId] = useState(templates[0]?.id ?? '')

  // Step 5 – starts with the default benefits of the preselected template.
  const [benefitIds, setBenefitIds] = useState<string[]>(
    () => defaultsByTemplate[templates[0]?.id ?? ''] ?? [],
  )
  const [benefitsTouched, setBenefitsTouched] = useState(false)

  const [pageSlug, setPageSlug] = useState('')
  const [slugTouched, setSlugTouched] = useState(false)

  const effectiveSlug = slugTouched ? slugify(pageSlug) : slugify(companyName)
  const pageTitle = companyName ? `SwissHub × ${companyName}` : 'SwissHub × Ihr Partner'

  // Preselect the template's default benefits until the admin edits the list.
  const templateDefaults = useMemo(() => defaultsByTemplate[templateId] ?? [], [defaultsByTemplate, templateId])

  function selectTemplate(id: string) {
    setTemplateId(id)
    if (!benefitsTouched) {
      setBenefitIds(defaultsByTemplate[id] ?? [])
    }
  }

  function validateStep(target: number): boolean {
    const next: Record<string, string> = {}
    if (target >= 1 && companyName.trim().length < 2) {
      next.companyName = 'Bitte geben Sie den Firmennamen ein.'
    }
    if (target >= 2 && contactEmail.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail.trim())) {
      next.contactEmail = 'Bitte geben Sie eine gültige E-Mail-Adresse ein.'
    }
    if (target >= 6 && effectiveSlug.length < 2) {
      next.pageSlug = 'Bitte geben Sie einen gültigen Link ein.'
    }
    setErrors(next)
    return Object.keys(next).length === 0
  }

  function goTo(target: number) {
    if (target > step && !validateStep(step)) return
    setStep(target)
    setMaxReached((value) => Math.max(value, target))
  }

  function handleQuickTournament(formData: FormData) {
    startTransition(async () => {
      const result = await quickCreateTournamentAction(IDLE, formData)
      if (result.status === 'success' && result.data?.id) {
        const created: Tournament = {
          id: result.data.id,
          title: result.data.title ?? '',
          slug: '',
          game: result.data.game ?? '',
          description: null,
          startDate: null,
          endDate: null,
          format: null,
          participantCount: null,
          expectedParticipantCount: null,
          streamViewerCount: null,
          status: 'PLANNED',
          twitchUrl: null,
          vodUrl: null,
          heroImageId: null,
          internalNotes: null,
          featured: true,
          order: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        }
        setTournaments((current) => [created, ...current])
        setTournamentId(created.id)
        setTournamentDialog(false)
        toast.success('Turnier erstellt und zugeordnet.')
        router.refresh()
      } else {
        toast.error(result.message ?? 'Das Turnier konnte nicht erstellt werden.')
      }
    })
  }

  function submit() {
    if (!validateStep(6)) {
      setStep(1)
      return
    }
    setFormError(null)

    const formData = new FormData()
    formData.set('companyName', companyName.trim())
    formData.set('logoId', logoId)
    formData.set('website', website.trim())
    formData.set('industry', industry.trim())
    formData.set('contactName', contactName.trim())
    formData.set('contactEmail', contactEmail.trim())
    formData.set('contactPhone', contactPhone.trim())
    formData.set('internalNotes', internalNotes.trim())
    formData.set('status', status)
    formData.set('tournamentId', tournamentId)
    formData.set('requestedSupportType', supportType)
    formData.set('requestedAmount', amount.trim())
    formData.set('requestedSupportText', supportText.trim())
    formData.set('currency', currency.trim() || 'CHF')
    formData.set('templateId', templateId)
    formData.set('pageTitle', pageTitle)
    formData.set('pageSlug', effectiveSlug)
    for (const id of benefitIds) formData.append('benefitIds', id)

    startTransition(async () => {
      const result = await createSponsorWithPageAction(IDLE, formData)
      // On success the action redirects, so reaching here means it failed.
      if (result.status === 'error') {
        setFormError(result.message ?? 'Der Sponsor konnte nicht erstellt werden.')
        if (result.errors) setErrors(result.errors)
        toast.error(result.message ?? 'Der Sponsor konnte nicht erstellt werden.')
      }
    })
  }

  const selectedTournament = tournaments.find((tournament) => tournament.id === tournamentId)
  const showAmount = supportType === 'MONEY' || supportType === 'COMBINATION'

  return (
    <>
      {formError ? (
        <Alert tone="danger" className="mb-4">
          {formError}
        </Alert>
      ) : null}

      <WizardShell steps={STEPS} current={step} maxReached={maxReached} onStepClick={goTo}>
        {step === 1 ? (
          <div className="space-y-5">
            <Input
              label="Firmenname"
              required
              value={companyName}
              onChange={(event) => setCompanyName(event.target.value)}
              error={errors.companyName}
              placeholder="z. B. Digitec Galaxus AG"
              autoFocus
              maxLength={160}
            />
            <MediaPicker
              label="Logo des Unternehmens"
              hint="Laden Sie das Logo hoch oder hinterlegen Sie eine URL. Logos werden nie automatisch aus dem Internet geladen."
              value={logoId}
              initialMedia={logoMedia}
              onChange={(id, media) => {
                setLogoId(id)
                setLogoMedia(media)
              }}
            />
            <Input
              label="Website"
              value={website}
              onChange={(event) => setWebsite(event.target.value)}
              placeholder="digitec.ch"
              inputMode="url"
              hint="https:// wird automatisch ergänzt."
            />
            <Input
              label="Branche"
              value={industry}
              onChange={(event) => setIndustry(event.target.value)}
              placeholder="z. B. Online-Handel, Hosting, Gaming-Hardware"
              list="known-industries"
            />
            <datalist id="known-industries">
              {knownIndustries.map((entry) => (
                <option key={entry} value={entry} />
              ))}
            </datalist>
          </div>
        ) : null}

        {step === 2 ? (
          <div className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Ansprechpartner"
                value={contactName}
                onChange={(event) => setContactName(event.target.value)}
                placeholder="Vor- und Nachname"
                maxLength={160}
              />
              <Input
                label="E-Mail"
                type="email"
                inputMode="email"
                value={contactEmail}
                onChange={(event) => setContactEmail(event.target.value)}
                error={errors.contactEmail}
                placeholder="name@unternehmen.ch"
                maxLength={200}
              />
            </div>
            <Input
              label="Telefonnummer"
              type="tel"
              value={contactPhone}
              onChange={(event) => setContactPhone(event.target.value)}
              placeholder="+41 44 000 00 00"
              maxLength={60}
            />
            <Select label="Status" value={status} onChange={(event) => setStatus(event.target.value)}>
              {SPONSOR_STATUS_ORDER.map((entry) => (
                <option key={entry} value={entry}>
                  {SPONSOR_STATUS[entry].label}
                </option>
              ))}
            </Select>
            <Textarea
              label="Interne Notizen"
              value={internalNotes}
              onChange={(event) => setInternalNotes(event.target.value)}
              rows={4}
              maxLength={5000}
              placeholder="Nur intern sichtbar – z. B. woher der Kontakt stammt oder worauf zu achten ist."
              hint="Diese Notizen erscheinen niemals auf der öffentlichen Sponsorenseite."
            />
          </div>
        ) : null}

        {step === 3 ? (
          <div className="space-y-5">
            <Select
              label="Turnier zuordnen"
              value={tournamentId}
              onChange={(event) => setTournamentId(event.target.value)}
              hint="Optional. Die Zuordnung kann jederzeit geändert werden."
            >
              <option value="">Kein Turnier zuordnen</option>
              {tournaments.map((tournament) => (
                <option key={tournament.id} value={tournament.id}>
                  {tournament.title} · {tournament.game} ({TOURNAMENT_STATUS[tournament.status].label})
                </option>
              ))}
            </Select>

            <Button type="button" variant="secondary" onClick={() => setTournamentDialog(true)}>
              Neues Turnier erstellen
            </Button>

            {selectedTournament ? (
              <div className="rounded-control border border-line bg-surface-raised px-4 py-3.5">
                <p className="text-[13.5px] font-medium text-fg">{selectedTournament.title}</p>
                <p className="mt-1 text-[12.5px] text-fg-subtle">
                  {selectedTournament.game}
                  {selectedTournament.format ? ` · ${selectedTournament.format}` : ''}
                </p>
              </div>
            ) : null}
          </div>
        ) : null}

        {step === 4 ? (
          <div className="space-y-5">
            <Select
              label="Art der Unterstützung"
              value={supportType}
              onChange={(event) => setSupportType(event.target.value)}
            >
              {SUPPORT_TYPE_ORDER.map((entry) => (
                <option key={entry} value={entry}>
                  {SUPPORT_TYPE[entry].label}
                </option>
              ))}
            </Select>

            <div className="grid gap-4 sm:grid-cols-[1fr_120px]">
              <Input
                label={showAmount ? 'Gewünschter Betrag' : 'Gegenwert (optional)'}
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                placeholder="2000"
                inputMode="decimal"
                hint={
                  showAmount
                    ? 'Zahl ohne Währung, z. B. 2000. Wird als CHF 2’000 dargestellt.'
                    : 'Optional – z. B. der ungefähre Gegenwert der Sachleistung.'
                }
              />
              <Input label="Währung" value={currency} onChange={(event) => setCurrency(event.target.value)} maxLength={8} />
            </div>

            <Textarea
              label="Beschreibung der gewünschten Unterstützung"
              value={supportText}
              onChange={(event) => setSupportText(event.target.value)}
              rows={3}
              maxLength={1000}
              placeholder="z. B. Hardware im Gegenwert von ca. CHF 2’000 – idealerweise Headsets und Mäuse für die Siegerteams."
              hint="Dieser Text erscheint im Sponsoring-Vorschlag auf der Seite und ist danach frei editierbar."
            />
          </div>
        ) : null}

        {step === 5 ? (
          <BenefitSelector
            benefits={benefits}
            selected={benefitIds}
            onChange={(ids) => {
              setBenefitIds(ids)
              setBenefitsTouched(true)
            }}
            onBenefitCreated={(benefit) => setBenefits((current) => [...current, benefit])}
          />
        ) : null}

        {step === 6 ? (
          <div className="space-y-6">
            <TemplateSelector templates={templates} value={templateId} onChange={selectTemplate} />

            {!benefitsTouched && templateDefaults.length > 0 ? (
              <Alert tone="info">
                Dieses Template wählt {templateDefaults.length} Standardleistungen vor. Sie können die Auswahl in
                Schritt 5 jederzeit anpassen.
              </Alert>
            ) : null}

            <div className="space-y-4 rounded-card border border-line bg-surface-raised px-4 py-4">
              <p className="text-[13px] font-medium text-fg">Sponsorenseite</p>
              <Input
                label="Titel der Seite"
                value={pageTitle}
                readOnly
                hint="Wird aus dem Firmennamen erzeugt und ist im Editor frei änderbar."
              />
              <Input
                label="Link"
                prefix="/partner/"
                value={slugTouched ? pageSlug : effectiveSlug}
                onChange={(event) => {
                  setSlugTouched(true)
                  setPageSlug(event.target.value)
                }}
                error={errors.pageSlug}
                hint="Dieser Link wird später in der E-Mail an das Unternehmen verwendet."
                maxLength={80}
              />
            </div>

            <div className="rounded-card border border-line px-4 py-4">
              <p className="mb-3 text-[13px] font-medium text-fg">Zusammenfassung</p>
              <dl className="grid gap-2.5 text-[13px] sm:grid-cols-2">
                <SummaryRow label="Unternehmen" value={companyName || '—'} />
                <SummaryRow label="Ansprechpartner" value={contactName || '—'} />
                <SummaryRow label="Status" value={SPONSOR_STATUS[status as keyof typeof SPONSOR_STATUS].label} />
                <SummaryRow label="Turnier" value={selectedTournament?.title ?? 'Kein Turnier'} />
                <SummaryRow
                  label="Unterstützung"
                  value={`${SUPPORT_TYPE[supportType as keyof typeof SUPPORT_TYPE].label}${amount ? ` · ${currency} ${amount}` : ''}`}
                />
                <SummaryRow label="Leistungen" value={`${benefitIds.length} ausgewählt`} />
              </dl>
            </div>
          </div>
        ) : null}

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-5">
          <Button
            type="button"
            variant="ghost"
            onClick={() => (step === 1 ? router.push('/admin/sponsors') : setStep(step - 1))}
            disabled={isPending}
          >
            {step === 1 ? 'Abbrechen' : 'Zurück'}
          </Button>

          {step < STEPS.length ? (
            <Button type="button" onClick={() => goTo(step + 1)}>
              Weiter
            </Button>
          ) : (
            <Button type="button" onClick={submit} loading={isPending}>
              Sponsor & Seite erstellen
            </Button>
          )}
        </div>
      </WizardShell>

      <Modal
        open={tournamentDialog}
        onClose={() => setTournamentDialog(false)}
        title="Neues Turnier erstellen"
        description="Die wichtigsten Angaben genügen – Details ergänzen Sie später in der Turnierverwaltung."
        size="md"
        busy={isPending}
      >
        <form action={handleQuickTournament} className="space-y-4">
          <Input label="Turniername" name="title" required placeholder="z. B. SwissHub CS2 Cup 2026" maxLength={200} />
          <Input label="Spiel" name="game" required placeholder="z. B. Counter-Strike 2" maxLength={120} />
          <Input label="Startdatum" name="startDate" type="date" />
          <input type="hidden" name="status" value="PLANNED" />
          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="ghost" onClick={() => setTournamentDialog(false)}>
              Abbrechen
            </Button>
            <Button type="submit" loading={isPending}>
              Turnier erstellen
            </Button>
          </div>
        </form>
      </Modal>
    </>
  )
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-[12px] text-fg-subtle">{label}</dt>
      <dd className="truncate text-fg">{value}</dd>
    </div>
  )
}
