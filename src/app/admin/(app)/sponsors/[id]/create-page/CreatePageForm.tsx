'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import type { PageTemplate, SponsoringBenefit, Tournament } from '@prisma/client'

import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { Input, Select, Textarea } from '@/components/ui/Field'
import { useToast } from '@/components/ui/Toast'
import { BenefitSelector } from '@/components/admin/BenefitSelector'
import { TemplateSelector } from '@/components/admin/TemplateSelector'
import { SUPPORT_TYPE, SUPPORT_TYPE_ORDER, TOURNAMENT_STATUS } from '@/lib/labels'
import { IDLE } from '@/lib/result'
import { slugify } from '@/lib/slug'
import { createPageForSponsorAction } from '@/server/actions/wizard'

export interface CreatePageFormProps {
  sponsor: { id: string; companyName: string; slug: string }
  benefits: SponsoringBenefit[]
  templates: (PageTemplate & { _count: { defaultBenefits: number } })[]
  tournaments: Tournament[]
  defaultsByTemplate: Record<string, string[]>
}

/**
 * Single-screen variant of the wizard for sponsors that already exist.
 * Everything is on one page because the company data is already known.
 */
export function CreatePageForm({
  sponsor,
  benefits: initialBenefits,
  templates,
  tournaments,
  defaultsByTemplate,
}: CreatePageFormProps) {
  const router = useRouter()
  const toast = useToast()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const [benefits, setBenefits] = useState(initialBenefits)
  const [templateId, setTemplateId] = useState(templates[0]?.id ?? '')
  const [benefitIds, setBenefitIds] = useState<string[]>(defaultsByTemplate[templates[0]?.id ?? ''] ?? [])
  const [benefitsTouched, setBenefitsTouched] = useState(false)
  const [tournamentId, setTournamentId] = useState('')
  const [supportType, setSupportType] = useState('MONEY')
  const [amount, setAmount] = useState('')
  const [currency, setCurrency] = useState('CHF')
  const [supportText, setSupportText] = useState('')
  const [title, setTitle] = useState(`SwissHub × ${sponsor.companyName}`)
  const [subtitle, setSubtitle] = useState('Gemeinsam bringen wir die Schweizer Gaming-Community zusammen.')
  const [slug, setSlug] = useState(sponsor.slug)

  function selectTemplate(id: string) {
    setTemplateId(id)
    if (!benefitsTouched) setBenefitIds(defaultsByTemplate[id] ?? [])
  }

  function submit() {
    const normalisedSlug = slugify(slug)
    if (normalisedSlug.length < 2) {
      setError('Bitte geben Sie einen gültigen Link ein.')
      return
    }
    setError(null)

    const formData = new FormData()
    formData.set('sponsorId', sponsor.id)
    formData.set('templateId', templateId)
    formData.set('tournamentId', tournamentId)
    formData.set('requestedSupportType', supportType)
    formData.set('requestedAmount', amount.trim())
    formData.set('requestedSupportText', supportText.trim())
    formData.set('currency', currency.trim() || 'CHF')
    formData.set('pageTitle', title.trim())
    formData.set('pageSubtitle', subtitle.trim())
    formData.set('pageSlug', normalisedSlug)
    for (const id of benefitIds) formData.append('benefitIds', id)

    startTransition(async () => {
      const result = await createPageForSponsorAction(IDLE, formData)
      if (result.status === 'error') {
        setError(result.message ?? 'Die Seite konnte nicht erstellt werden.')
        toast.error(result.message ?? 'Die Seite konnte nicht erstellt werden.')
      }
    })
  }

  const showAmount = supportType === 'MONEY' || supportType === 'COMBINATION'

  return (
    <div className="space-y-5">
      {error ? <Alert tone="danger">{error}</Alert> : null}

      <Card>
        <CardHeader title="Grunddaten" description="Titel, Untertitel und der Link, den das Unternehmen erhält." />
        <CardBody className="space-y-4">
          <Input label="Titel" value={title} onChange={(event) => setTitle(event.target.value)} maxLength={200} required />
          <Input
            label="Untertitel"
            value={subtitle}
            onChange={(event) => setSubtitle(event.target.value)}
            maxLength={300}
          />
          <Input
            label="Link"
            prefix="/partner/"
            value={slug}
            onChange={(event) => setSlug(event.target.value)}
            maxLength={80}
            hint="Wird beim Speichern automatisch bereinigt und bei Bedarf eindeutig gemacht."
          />
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Turnier & Sponsoring" description="Worum geht es konkret in diesem Pitch?" />
        <CardBody className="space-y-4">
          <Select label="Turnier" value={tournamentId} onChange={(event) => setTournamentId(event.target.value)}>
            <option value="">Kein Turnier zuordnen</option>
            {tournaments.map((tournament) => (
              <option key={tournament.id} value={tournament.id}>
                {tournament.title} · {tournament.game} ({TOURNAMENT_STATUS[tournament.status].label})
              </option>
            ))}
          </Select>

          <div className="grid gap-4 sm:grid-cols-3">
            <Select
              label="Art der Unterstützung"
              value={supportType}
              onChange={(event) => setSupportType(event.target.value)}
              wrapperClassName="sm:col-span-1"
            >
              {SUPPORT_TYPE_ORDER.map((entry) => (
                <option key={entry} value={entry}>
                  {SUPPORT_TYPE[entry].label}
                </option>
              ))}
            </Select>
            <Input
              label={showAmount ? 'Betrag' : 'Gegenwert (optional)'}
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              inputMode="decimal"
              placeholder="2000"
            />
            <Input label="Währung" value={currency} onChange={(event) => setCurrency(event.target.value)} maxLength={8} />
          </div>

          <Textarea
            label="Beschreibung der gewünschten Unterstützung"
            value={supportText}
            onChange={(event) => setSupportText(event.target.value)}
            rows={3}
            maxLength={1000}
            placeholder="z. B. Hardware im Gegenwert von ca. CHF 2’000"
          />
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Leistungen" description="Was erhält der Sponsor im Gegenzug?" />
        <CardBody>
          <BenefitSelector
            benefits={benefits}
            selected={benefitIds}
            onChange={(ids) => {
              setBenefitIds(ids)
              setBenefitsTouched(true)
            }}
            onBenefitCreated={(benefit) => setBenefits((current) => [...current, benefit])}
          />
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Template" description="Nur der Ausgangspunkt – danach ist jede Sektion frei editierbar." />
        <CardBody>
          <TemplateSelector templates={templates} value={templateId} onChange={selectTemplate} />
        </CardBody>
      </Card>

      <div className="flex flex-wrap items-center justify-end gap-2.5">
        <Button
          type="button"
          variant="ghost"
          onClick={() => router.push(`/admin/sponsors/${sponsor.id}`)}
          disabled={isPending}
        >
          Abbrechen
        </Button>
        <Button type="button" onClick={submit} loading={isPending}>
          Sponsorenseite erstellen
        </Button>
      </div>
    </div>
  )
}
